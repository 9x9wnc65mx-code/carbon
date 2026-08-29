import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, Link, Outlet, redirect, useLoaderData } from "react-router";
import {
  createFlockCycle,
  flockCycleValidator,
  getFarms,
  getFlockCycles,
  getPoultryHouses
} from "~/modules/poultry";
import { FlockForm } from "~/modules/poultry/ui/PoultryRegistryForm";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";
import type { Handle } from "~/utils/handle";

export const handle: Handle = { breadcrumb: msg`Flocks`, to: "/x/poultry/flocks" };

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  const [farms, houses, flocks] = await Promise.all([
    getFarms(client, companyId),
    getPoultryHouses(client, companyId),
    getFlockCycles(client, companyId)
  ]);
  return { farms: farms.data ?? [], houses: houses.data ?? [], flocks: flocks.data ?? [] };
}

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);
  const { client, companyId, userId } = await requirePermissions(request, { create: "production" });
  const formData = await request.formData();
  if (formData.get("_intent") !== "createFlock") {
    return data({}, await flash(request, error(null, "Unsupported flock action")));
  }
  const validation = await validator(flockCycleValidator).validate(formData);
  if (validation.error) return validationError(validation.error);
  const result = await createFlockCycle(client, validation.data, { companyId, userId });
  if (result.error) return data({}, await flash(request, error(result.error, "Failed to create flock")));
  throw redirect(`/x/poultry/flocks/${result.data.id}`, await flash(request, success("Flock created")));
}

export default function PoultryFlocksRoute() {
  const { farms, houses, flocks } = useLoaderData<typeof loader>();
  const farmById = Object.fromEntries(farms.map((farm) => [farm.id, farm]));
  const houseById = Object.fromEntries(houses.map((house) => [house.id, house]));
  const houseOptions = houses.map((house) => ({ id: house.id, code: house.code, name: house.name, farmName: farmById[house.farmId]?.name }));

  return (
    <>
      <div className="w-full h-full overflow-y-auto p-4 md:p-6">
        <VStack spacing={4}>
          <div className="w-full flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div><h1 className="text-2xl font-semibold text-balance"><Trans>Flocks</Trans></h1><p className="mt-1 text-sm text-muted-foreground text-pretty"><Trans>Each flock is the central biological identity linking origin, location, performance, feed exposure, health, laboratory results and slaughter outcomes.</Trans></p></div>
            <Button asChild variant="secondary"><Link to="/x/poultry/farms"><Trans>Open Farms</Trans></Link></Button>
          </div>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Register flock</Trans></CardTitle></CardHeader><CardContent>
            {houses.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>Create a farm and poultry house before registering a flock.</Trans></p> : <FlockForm houses={houseOptions} intent="createFlock" submitLabel={<Trans>Create flock</Trans>} />}
          </CardContent></Card>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Flock registry</Trans></CardTitle></CardHeader><CardContent>
            {flocks.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>No poultry flocks have been registered yet.</Trans></p> : (
              <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground"><tr className="border-b text-start"><th className="px-3 py-2 font-medium"><Trans>Flock</Trans></th><th className="px-3 py-2 font-medium"><Trans>Farm / House</Trans></th><th className="px-3 py-2 font-medium"><Trans>Type</Trans></th><th className="px-3 py-2 font-medium"><Trans>Placement</Trans></th><th className="px-3 py-2 font-medium"><Trans>Initial birds</Trans></th><th className="px-3 py-2 font-medium"><Trans>Status</Trans></th><th className="px-3 py-2" /></tr></thead>
                <tbody>{flocks.map((flock) => {
                  const house = houseById[flock.houseId];
                  const farm = house ? farmById[house.farmId] : null;
                  return <tr key={flock.id} className="border-b last:border-0"><td className="px-3 py-3"><div className="font-medium"><TechnicalText>{flock.code}</TechnicalText></div>{flock.strain ? <div className="mt-0.5 text-xs text-muted-foreground"><TechnicalText>{flock.strain}</TechnicalText></div> : null}</td><td className="px-3 py-3">{farm?.name ?? "—"} / {house?.name ?? "—"}</td><td className="px-3 py-3">{flock.flockType}</td><td className="px-3 py-3 tabular-nums" dir="ltr">{flock.placementDate}</td><td className="px-3 py-3 tabular-nums" dir="ltr">{flock.initialBirdCount.toLocaleString()}</td><td className="px-3 py-3">{flock.status}</td><td className="px-3 py-3 text-end"><Button asChild size="sm" variant="secondary"><Link to={`/x/poultry/flocks/${flock.id}`}><Trans>Passport</Trans></Link></Button></td></tr>;
                })}</tbody>
              </table></div>
            )}
          </CardContent></Card>
        </VStack>
      </div>
      <Outlet />
    </>
  );
}
