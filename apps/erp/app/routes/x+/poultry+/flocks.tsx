import { requirePermissions } from "@carbon/auth/auth.server";
import { Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import type { LoaderFunctionArgs } from "react-router";
import Empty from "~/components/Empty";
import type { Handle } from "~/utils/handle";

export const handle: Handle = {
  breadcrumb: msg`Flocks`,
  to: "/x/poultry/flocks"
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  return null;
}

export default function PoultryFlocksRoute() {
  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6">
      <VStack spacing={4} className="h-full">
        <div className="w-full">
          <h1 className="text-2xl font-semibold text-balance">
            <Trans>Flocks</Trans>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            <Trans>
              Each flock is the central biological record linking origin, farm,
              house, performance, feed exposure, health, laboratory results and
              slaughter outcomes.
            </Trans>
          </p>
        </div>

        <Card className="w-full flex-1 min-h-[320px]">
          <CardHeader>
            <CardTitle>
              <Trans>Flock registry</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full min-h-[240px]">
            <Empty>
              <p className="max-w-md text-center text-sm text-muted-foreground text-pretty">
                <Trans>No poultry flocks have been registered yet.</Trans>
              </p>
            </Empty>
          </CardContent>
        </Card>
      </VStack>
    </div>
  );
}
