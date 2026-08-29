import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, Link, redirect, useLoaderData } from "react-router";
import {
  flockCycleValidator,
  getFarm,
  getFarms,
  getFlockCycle,
  getPoultryHouse,
  getPoultryHouses,
  updateFlockCycle
} from "~/modules/poultry";
import { FlockForm } from "~/modules/poultry/ui/PoultryRegistryForm";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  if (!params.flockId) throw new Response("Flock not found", { status: 404 });

  const flock = await getFlockCycle(client, companyId, params.flockId);
  if (flock.error || !flock.data) throw new Response("Flock not found", { status: 404 });

  const [house, farms, houses] = await Promise.all([
    getPoultryHouse(client, companyId, flock.data.houseId),
    getFarms(client, companyId),
    getPoultryHouses(client, companyId)
  ]);
  const farm = house.data ? await getFarm(client, companyId, house.data.farmId) : { data: null };

  return {
    flock: flock.data,
    house: house.data,
    farm: farm.data,
    farms: farms.data ?? [],
    houses: houses.data ?? []
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  if (!params.flockId) throw new Response("Flock not found", { status: 404 });
  const { client, companyId, userId } = await requirePermissions(request, { update: "production" });
  const formData = await request.formData();
  if (formData.get("_intent") !== "updateFlock") {
    return data({}, await flash(request, error(null, "Unsupported flock action")));
  }
  const validation = await validator(flockCycleValidator).validate(formData);
  if (validation.error) return validationError(validation.error);
  const result = await updateFlockCycle(client, params.flockId, validation.data, { companyId, userId });
  if (result.error) return data({}, await flash(request, error(result.error, "Failed to update flock")));
  throw redirect(`/x/poultry/flocks/${params.flockId}`, await flash(request, success("Flock passport updated")));
}

function PassportItem({ label, children }: { label: ReactNode; children: ReactNode }) {
  return <div className="rounded-lg border bg-muted/20 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-sm font-medium">{children}</div></div>;
}

export default function FlockDigitalPassportRoute() {
  const { flock, house, farm, farms, houses } = useLoaderData<typeof loader>();
  const farmById = Object.fromEntries(farms.map((item) => [item.id, item]));
  const houseOptions = houses.map((item) => ({ id: item.id, code: item.code, name: item.name, farmName: farmById[item.farmId]?.name }));

  return (
    <>
      <Link to="/x/poultry/flocks" aria-label="Close flock passport" className="fixed inset-0 z-40 bg-background/70 backdrop-blur-[1px]" />
      <aside className="fixed inset-y-0 end-0 z-50 w-full max-w-4xl overflow-y-auto border-s bg-background p-4 shadow-xl md:p-6">
        <VStack spacing={4}>
          <div className="flex w-full items-start justify-between gap-4">
            <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground"><Trans>Flock Digital Passport</Trans></p><h2 className="mt-1 text-xl font-semibold"><TechnicalText>{flock.code}</TechnicalText></h2><p className="mt-1 text-sm text-muted-foreground">{flock.status} · {flock.flockType}{flock.strain ? <> · <TechnicalText>{flock.strain}</TechnicalText></> : null}</p></div>
            <Button asChild variant="secondary" size="sm"><Link to="/x/poultry/flocks"><Trans>Close</Trans></Link></Button>
          </div>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Identity & provenance</Trans></CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PassportItem label={<Trans>Farm</Trans>}>{farm ? <>{farm.name} · <TechnicalText>{farm.code}</TechnicalText></> : "—"}</PassportItem>
              <PassportItem label={<Trans>House</Trans>}>{house ? <>{house.name} · <TechnicalText>{house.code}</TechnicalText></> : "—"}</PassportItem>
              <PassportItem label={<Trans>Placement date</Trans>}><span dir="ltr" className="tabular-nums">{flock.placementDate}</span></PassportItem>
              <PassportItem label={<Trans>Initial birds</Trans>}><span dir="ltr" className="tabular-nums">{flock.initialBirdCount.toLocaleString()}</span></PassportItem>
              <PassportItem label={<Trans>Hatch date</Trans>}><span dir="ltr" className="tabular-nums">{flock.hatchDate || "—"}</span></PassportItem>
              <PassportItem label={<Trans>Sex</Trans>}>{flock.sex}</PassportItem>
              <PassportItem label={<Trans>Source reference</Trans>}>{flock.sourceReference ? <TechnicalText>{flock.sourceReference}</TechnicalText> : "—"}</PassportItem>
              <PassportItem label={<Trans>Traceability identity</Trans>}><span className="text-emerald-600"><Trans>Identity anchor active</Trans></span></PassportItem>
            </div>
          </CardContent></Card>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Digital thread</Trans></CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <PassportItem label={<Trans>Chick / hatchery origin</Trans>}><span className="text-muted-foreground"><Trans>Ready for origin lot linkage</Trans></span></PassportItem>
              <PassportItem label={<Trans>Feed exposure</Trans>}><span className="text-muted-foreground"><Trans>Ready for feed lot genealogy</Trans></span></PassportItem>
              <PassportItem label={<Trans>Health & laboratory</Trans>}><span className="text-muted-foreground"><Trans>Ready for event and sample linkage</Trans></span></PassportItem>
              <PassportItem label={<Trans>Slaughter & quality</Trans>}><span className="text-muted-foreground"><Trans>Ready for downstream outcome linkage</Trans></span></PassportItem>
            </div>
            <p className="mt-3 text-xs text-muted-foreground"><Trans>The passport is a read model over the flock identity and linked domains; it does not duplicate genealogy data.</Trans></p>
          </CardContent></Card>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Edit flock identity</Trans></CardTitle></CardHeader><CardContent><FlockForm houses={houseOptions} initial={flock} intent="updateFlock" submitLabel={<Trans>Save flock</Trans>} /></CardContent></Card>
        </VStack>
      </aside>
    </>
  );
}
