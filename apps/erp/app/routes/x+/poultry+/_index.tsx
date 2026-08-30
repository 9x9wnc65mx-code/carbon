import { requirePermissions } from "@carbon/auth/auth.server";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HStack,
  VStack
} from "@carbon/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { LuBird, LuFlaskConical, LuHouse, LuPackage } from "react-icons/lu";
import type { LoaderFunctionArgs } from "react-router";
import { Link } from "react-router";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";
import type { Handle } from "~/utils/handle";

export const handle: Handle = {
  breadcrumb: msg`Overview`,
  to: "/x/poultry"
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  return null;
}

export default function PoultryOverview() {
  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6">
      <VStack spacing={4}>
        <div className="w-full">
          <h1 className="text-2xl font-semibold text-balance">
            <Trans>Poultry Operations</Trans>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            <Trans>
              One operational workspace for farms, flocks, laboratory results,
              feed exposure, quality and end-to-end poultry traceability.
            </Trans>
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <Trans>Operational Digital Thread</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VStack spacing={3}>
              <p className="text-sm text-muted-foreground text-pretty">
                <Trans>
                  AVIOS keeps breeder, egg, chick, flock and slaughter records
                  connected to the same biological lifecycle instead of storing
                  them as isolated records.
                </Trans>
              </p>
              <div
                className="w-full rounded-xl bg-muted/50 px-4 py-3 font-mono text-sm tabular-nums overflow-x-auto"
                dir="ltr"
              >
                <TechnicalText>
                  B-101 → E-404 → C-711 → F-2026-001 → SL-902
                </TechnicalText>
              </div>
              <p className="text-sm text-muted-foreground text-pretty">
                <Trans>
                  The same thread connects feed raw-material and finished-feed lots,
                  laboratory samples, diagnostics, QMS events and production outcomes
                  to the flock digital passport.
                </Trans>
              </p>
            </VStack>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle>
                <HStack>
                  <LuHouse />
                  <Trans>Farms</Trans>
                </HStack>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VStack spacing={3}>
                <p className="text-sm text-muted-foreground text-pretty">
                  <Trans>
                    Manage poultry sites and the houses that become the physical
                    home of each flock lifecycle.
                  </Trans>
                </p>
                <Button asChild variant="secondary">
                  <Link to="/x/poultry/farms">
                    <Trans>Open Farms</Trans>
                  </Link>
                </Button>
              </VStack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <HStack>
                  <LuBird />
                  <Trans>Flocks</Trans>
                </HStack>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VStack spacing={3}>
                <p className="text-sm text-muted-foreground text-pretty">
                  <Trans>
                    Follow each flock as the central biological entity that ties
                    performance, health, feed, laboratory and slaughter data
                    together.
                  </Trans>
                </p>
                <Button asChild variant="secondary">
                  <Link to="/x/poultry/flocks">
                    <Trans>Open Flocks</Trans>
                  </Link>
                </Button>
              </VStack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <HStack>
                  <LuFlaskConical />
                  <Trans>Laboratory</Trans>
                </HStack>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VStack spacing={3}>
                <p className="text-sm text-muted-foreground text-pretty">
                  <Trans>
                    Configure test definitions and parameters, accession samples,
                    enter analytical results and lock verified laboratory evidence.
                  </Trans>
                </p>
                <Button asChild variant="secondary">
                  <Link to="/x/poultry/laboratories">
                    <Trans>Open Laboratory Center</Trans>
                  </Link>
                </Button>
              </VStack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <HStack>
                  <LuPackage />
                  <Trans>Feed & Feed Mill</Trans>
                </HStack>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VStack spacing={3}>
                <p className="text-sm text-muted-foreground text-pretty">
                  <Trans>
                    Extend Carbon batch-tracked feed inventory with specifications,
                    COA and laboratory evidence, then connect each real feed lot to
                    flock exposure.
                  </Trans>
                </p>
                <Button asChild variant="secondary">
                  <Link to="/x/poultry/feed">
                    <Trans>Open Feed Center</Trans>
                  </Link>
                </Button>
              </VStack>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <Trans>Connected AVIOS domains</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground text-pretty">
              <Trans>
                Breeders and hatchery · Veterinary LIMS · Feed and feed mill ·
                Slaughterhouse QC · Quality/QMS · Inventory and purchasing ·
                Traceability · Analytics and AI
              </Trans>
            </p>
          </CardContent>
        </Card>
      </VStack>
    </div>
  );
}
