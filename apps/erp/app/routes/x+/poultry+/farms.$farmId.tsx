import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, Link, redirect, useLoaderData } from "react-router";
import {
  farmValidator,
  getFarm,
  getPoultryHouses,
  poultryHouseValidator,
  updateFarm,
  updatePoultryHouse
} from "~/modules/poultry";
import { FarmForm, HouseForm } from "~/modules/poultry/ui/PoultryRegistryForm";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  if (!params.farmId) throw new Response("Farm not found", { status: 404 });
  const [farm, houses] = await Promise.all([
    getFarm(client, companyId, params.farmId),
    getPoultryHouses(client, companyId, params.farmId)
  ]);
  if (farm.error || !farm.data) throw new Response("Farm not found", { status: 404 });
  return { farm: farm.data, houses: houses.data ?? [] };
}

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  if (!params.farmId) throw new Response("Farm not found", { status: 404 });
  const { client, companyId, userId } = await requirePermissions(request, { update: "production" });
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "updateFarm") {
    const validation = await validator(farmValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await updateFarm(client, params.farmId, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to update poultry farm")));
    throw redirect(`/x/poultry/farms/${params.farmId}`, await flash(request, success("Poultry farm updated")));
  }

  if (intent === "updateHouse") {
    const validation = await validator(poultryHouseValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    if (!validation.data.id) return data({}, await flash(request, error(null, "House ID is required")));
    const result = await updatePoultryHouse(client, validation.data.id, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to update poultry house")));
    throw redirect(`/x/poultry/farms/${params.farmId}`, await flash(request, success("Poultry house updated")));
  }

  return data({}, await flash(request, error(null, "Unsupported farm action")));
}

export default function PoultryFarmDetailRoute() {
  const { farm, houses } = useLoaderData<typeof loader>();
  const farms = [{ id: farm.id, code: farm.code, name: farm.name }];
  return (
    <>
      <Link to="/x/poultry/farms" aria-label="Close farm details" className="fixed inset-0 z-40 bg-background/70 backdrop-blur-[1px]" />
      <aside className="fixed inset-y-0 end-0 z-50 w-full max-w-3xl overflow-y-auto border-s bg-background p-4 shadow-xl md:p-6">
        <VStack spacing={4}>
          <div className="flex w-full items-start justify-between gap-4">
            <div><h2 className="text-xl font-semibold">{farm.name}</h2><div className="mt-1 text-sm text-muted-foreground"><TechnicalText>{farm.code}</TechnicalText></div></div>
            <Button asChild variant="secondary" size="sm"><Link to="/x/poultry/farms"><Trans>Close</Trans></Link></Button>
          </div>
          <Card className="w-full"><CardHeader><CardTitle><Trans>Farm profile</Trans></CardTitle></CardHeader><CardContent><FarmForm initial={farm} intent="updateFarm" submitLabel={<Trans>Save farm</Trans>} /></CardContent></Card>
          <Card className="w-full"><CardHeader><CardTitle><Trans>Houses</Trans></CardTitle></CardHeader><CardContent>
            {houses.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>No houses are registered for this farm.</Trans></p> : (
              <div className="grid gap-3">{houses.map((house) => (
                <details key={house.id} className="rounded-lg border p-3 open:bg-muted/20">
                  <summary className="cursor-pointer list-none font-medium"><span className="flex items-center justify-between gap-3"><span>{house.name} · <TechnicalText>{house.code}</TechnicalText></span><span className="text-xs font-normal text-muted-foreground tabular-nums" dir="ltr">{house.capacityBirds.toLocaleString()} birds</span></span></summary>
                  <div className="mt-4"><HouseForm farms={farms} initial={house} intent="updateHouse" submitLabel={<Trans>Save house</Trans>} /></div>
                </details>
              ))}</div>
            )}
          </CardContent></Card>
        </VStack>
      </aside>
    </>
  );
}
