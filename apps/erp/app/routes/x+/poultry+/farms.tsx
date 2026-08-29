import { requirePermissions } from "@carbon/auth/auth.server";
import { Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import type { LoaderFunctionArgs } from "react-router";
import Empty from "~/components/Empty";
import type { Handle } from "~/utils/handle";

export const handle: Handle = {
  breadcrumb: msg`Farms`,
  to: "/x/poultry/farms"
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  return null;
}

export default function PoultryFarmsRoute() {
  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6">
      <VStack spacing={4} className="h-full">
        <div className="w-full">
          <h1 className="text-2xl font-semibold text-balance">
            <Trans>Farms</Trans>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            <Trans>
              Manage poultry sites and house structure as the physical location
              layer for flock operations and traceability.
            </Trans>
          </p>
        </div>

        <Card className="w-full flex-1 min-h-[320px]">
          <CardHeader>
            <CardTitle>
              <Trans>Poultry farm registry</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full min-h-[240px]">
            <Empty>
              <p className="max-w-md text-center text-sm text-muted-foreground text-pretty">
                <Trans>No poultry farms have been registered yet.</Trans>
              </p>
            </Empty>
          </CardContent>
        </Card>
      </VStack>
    </div>
  );
}
