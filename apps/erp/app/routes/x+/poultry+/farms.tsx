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
  createFarm,
  createPoultryHouse,
  farmValidator,
  getFarms,
  getPoultryHouses,
  poultryHouseValidator
} from "~/modules/poultry";
import { FarmForm, HouseForm } from "~/modules/poultry/ui/PoultryRegistryForm";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";
import type { Handle } from "~/utils/handle";

export const handle: Handle = { breadcrumb: msg`Farms`, to: "/x/poultry/farms" };

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  const [farms, houses] = await Promise.all([
    getFarms(client, companyId),
    getPoultryHouses(client, companyId)
  ]);
  return { farms: farms.data ?? [], houses: houses.data ?? [] };
}

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);
  const { client, companyId, userId } = await requirePermissions(request, {
    create: "production"
  });
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "createFarm") {
    const validation = await validator(farmValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createFarm(client, validation.data, { companyId, userId });
    if (result.error) {
      return data({}, await flash(request, error(result.error, "Failed to create poultry farm")));
    }
    throw redirect("/x/poultry/farms", await flash(request, success("Poultry farm created")));
  }

  if (intent === "createHouse") {
    const validation = await validator(poultryHouseValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createPoultryHouse(client, validation.data, { companyId, userId });
    if (result.error) {
      return data({}, await flash(request, error(result.error, "Failed to create poultry house")));
    }
    throw redirect("/x/poultry/farms", await flash(request, success("Poultry house created")));
  }

  return data({}, await flash(request, error(null, "Unsupported poultry registry action")));
}

export default function PoultryFarmsRoute() {
  const { farms, houses } = useLoaderData<typeof loader>();
  const houseCount = houses.reduce<Record<string, number>>((counts, house) => {
    counts[house.farmId] = (counts[house.farmId] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <>
      <div className="w-full h-full overflow-y-auto p-4 md:p-6">
        <VStack spacing={4}>
          <div className="w-full flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-balance"><Trans>Farms & Houses</Trans></h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty"><Trans>Register the physical poultry structure inherited by flocks, samples, feed exposure and production events.</Trans></p>
            </div>
            <Button asChild variant="secondary"><Link to="/x/poultry/flocks"><Trans>Open Flocks</Trans></Link></Button>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
            <Card><CardHeader><CardTitle><Trans>Register farm</Trans></CardTitle></CardHeader><CardContent><FarmForm intent="createFarm" submitLabel={<Trans>Create farm</Trans>} /></CardContent></Card>
            <Card><CardHeader><CardTitle><Trans>Register house</Trans></CardTitle></CardHeader><CardContent>
              {farms.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>Create a farm before registering its poultry houses.</Trans></p> : <HouseForm farms={farms} intent="createHouse" submitLabel={<Trans>Create house</Trans>} />}
            </CardContent></Card>
          </div>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Poultry farm registry</Trans></CardTitle></CardHeader><CardContent>
            {farms.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>No poultry farms have been registered yet.</Trans></p> : (
              <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground"><tr className="border-b text-start"><th className="px-3 py-2 font-medium"><Trans>Code</Trans></th><th className="px-3 py-2 font-medium"><Trans>Farm</Trans></th><th className="px-3 py-2 font-medium"><Trans>Type</Trans></th><th className="px-3 py-2 font-medium"><Trans>Region</Trans></th><th className="px-3 py-2 font-medium"><Trans>Houses</Trans></th><th className="px-3 py-2 font-medium"><Trans>Status</Trans></th><th className="px-3 py-2" /></tr></thead>
                <tbody>{farms.map((farm) => <tr key={farm.id} className="border-b last:border-0"><td className="px-3 py-3"><TechnicalText>{farm.code}</TechnicalText></td><td className="px-3 py-3 font-medium">{farm.name}</td><td className="px-3 py-3">{farm.farmType}</td><td className="px-3 py-3">{farm.region || "—"}</td><td className="px-3 py-3 tabular-nums" dir="ltr">{houseCount[farm.id] ?? 0}</td><td className="px-3 py-3">{farm.status}</td><td className="px-3 py-3 text-end"><Button asChild size="sm" variant="secondary"><Link to={`/x/poultry/farms/${farm.id}`}><Trans>Open</Trans></Link></Button></td></tr>)}</tbody>
              </table></div>
            )}
          </CardContent></Card>
        </VStack>
      </div>
      <Outlet />
    </>
  );
}
