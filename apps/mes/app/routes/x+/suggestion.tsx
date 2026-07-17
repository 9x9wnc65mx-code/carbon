import { requirePermissions } from "@carbon/auth/auth.server";
import { getCarbonServiceRole } from "@carbon/auth/client.server";
import { validator } from "@carbon/form";
import { trigger } from "@carbon/jobs";
import { getSlackClient } from "@carbon/lib/slack.server";
import { getLogger } from "@carbon/logger";
import { NotificationEvent } from "@carbon/notifications";
import type { ActionFunctionArgs } from "react-router";
import { suggestionValidator } from "~/services/models";

const log = getLogger("mes");

export async function action({ request }: ActionFunctionArgs) {
  const { userId, companyId } = await requirePermissions(request, {});

  const formData = await request.formData();
  const validation = await validator(suggestionValidator).validate(formData);

  if (validation.error) {
    return {
      success: false,
      message: "Failed to submit suggestion"
    };
  }

  const {
    attachmentPath,
    emoji,
    suggestion,
    path,
    userId: formUserId,
    sendToCarbon
  } = validation.data;
  const serviceRole = await getCarbonServiceRole();

  const insertSuggestion = await serviceRole
    .from("suggestion")
    .insert([
      {
        suggestion,
        emoji,
        path,
        attachmentPath: attachmentPath || null,
        userId: formUserId || null,
        companyId
      }
    ])
    .select("id")
    .single();

  if (insertSuggestion.error) {
    return {
      success: false,
      message: "Failed to submit suggestion"
    };
  }

  const company = await serviceRole
    .from("company")
    .select("name, suggestionNotificationGroup")
    .eq("id", companyId)
    .single();

  if (sendToCarbon) {
    try {
      const [user, attachmentUrl] = await Promise.all([
        formUserId
          ? serviceRole
              .from("user")
              .select("firstName, lastName, email")
              .eq("id", formUserId)
              .single()
          : Promise.resolve(null),
        attachmentPath
          ? serviceRole.storage
              .from("private")
              .createSignedUrl(attachmentPath, 60 * 60 * 24 * 7)
              .then((result) => result.data?.signedUrl ?? null)
          : Promise.resolve(null)
      ]);

      const submittedBy = user?.data
        ? `${user.data.firstName ?? ""} ${user.data.lastName ?? ""} <${
            user.data.email ?? ""
          }>`
        : "Anonymous";

      const slackClient = getSlackClient();
      await slackClient.sendMessage({
        channel: "#feedback",
        text: `New suggestion from ${company.data?.name ?? companyId}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${emoji} New suggestion from *${
                company.data?.name ?? companyId
              }*`
            }
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: suggestion }
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Submitted by:*\n${submittedBy}` },
              { type: "mrkdwn", text: `*Page:*\n${path}` },
              {
                type: "mrkdwn",
                text: `*Attachment:*\n${
                  attachmentUrl ? `<${attachmentUrl}|View image>` : "None"
                }`
              }
            ]
          }
        ]
      });
    } catch (err) {
      log.error("Failed to send suggestion to Slack", { error: err });
    }
  }

  if (!company.error && company.data?.suggestionNotificationGroup?.length) {
    try {
      await trigger("notify", {
        companyId,
        documentId: insertSuggestion.data.id,
        event: NotificationEvent.SuggestionResponse,
        recipient: {
          type: "group",
          groupIds: company.data.suggestionNotificationGroup
        },
        from: formUserId || userId
      });
    } catch (err) {
      log.error("Failed to trigger suggestion notification", { error: err });
    }
  }

  return { success: true, message: "Suggestion submitted" };
}
