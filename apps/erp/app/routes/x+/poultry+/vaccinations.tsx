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
  addVaccineDiseaseTarget,
  createDisease,
  createDrug,
  createVaccinationProgram,
  createVaccine,
  diseaseCatalogValidator,
  drugCatalogValidator,
  getDiseaseCatalog,
  getDrugCatalog,
  getVaccinationPrograms,
  getVaccinationProgramSteps,
  getVaccineCatalog,
  getVaccineDiseaseTargets,
  vaccinationProgramValidator,
  vaccineCatalogValidator,
  vaccineDiseaseTargetValidator
} from "~/modules/poultry";
import {
  AddVaccineDiseaseTargetForm,
  DiseaseCatalogForm,
  DrugCatalogForm,
  VaccinationProgramForm,
  VaccineCatalogForm
} from "~/modules/poultry/ui/VaccinationForms";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";
import type { Handle } from "~/utils/handle";

export const handle: Handle = {
  breadcrumb: msg`Vaccination`,
  to: "/x/poultry/vaccinations"
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });

  const [diseases, vaccines, vaccineTargets, drugs, programs, steps] =
    await Promise.all([
      getDiseaseCatalog(client, companyId),
      getVaccineCatalog(client, companyId),
      getVaccineDiseaseTargets(client, companyId),
      getDrugCatalog(client, companyId),
      getVaccinationPrograms(client, companyId),
      getVaccinationProgramSteps(client, companyId)
    ]);

  return {
    diseases: diseases.data ?? [],
    vaccines: vaccines.data ?? [],
    vaccineTargets: vaccineTargets.data ?? [],
    drugs: drugs.data ?? [],
    programs: programs.data ?? [],
    steps: steps.data ?? []
  };
}

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);
  const formData = await request.formData();
  const intent = formData.get("_intent");
  const { client, companyId, userId } = await requirePermissions(request, {
    create: "production"
  });

  if (intent === "createDisease") {
    const validation = await validator(diseaseCatalogValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createDisease(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to create disease")));
    throw redirect("/x/poultry/vaccinations", await flash(request, success("Disease added to catalog")));
  }

  if (intent === "createVaccine") {
    const validation = await validator(vaccineCatalogValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createVaccine(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to create vaccine")));
    throw redirect("/x/poultry/vaccinations", await flash(request, success("Vaccine added to catalog")));
  }

  if (intent === "addVaccineDisease") {
    const validation = await validator(vaccineDiseaseTargetValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await addVaccineDiseaseTarget(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to add vaccine target")));
    throw redirect("/x/poultry/vaccinations", await flash(request, success("Vaccine target added")));
  }

  if (intent === "createDrug") {
    const validation = await validator(drugCatalogValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createDrug(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to create drug")));
    throw redirect("/x/poultry/vaccinations", await flash(request, success("Drug added to catalog")));
  }

  if (intent === "createProgram") {
    const validation = await validator(vaccinationProgramValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createVaccinationProgram(client, validation.data, { companyId, userId });
    if (result.error || !result.data) return data({}, await flash(request, error(result.error, "Failed to create vaccination program")));
    throw redirect(`/x/poultry/vaccinations/${result.data.id}`, await flash(request, success("Vaccination program created")));
  }

  return data({}, await flash(request, error(null, "Unsupported vaccination action")));
}

export default function PoultryVaccinationsRoute() {
  const { diseases, vaccines, vaccineTargets, drugs, programs, steps } =
    useLoaderData<typeof loader>();
  const diseaseById = Object.fromEntries(diseases.map((disease) => [disease.id, disease]));
  const targetsByVaccine = vaccineTargets.reduce<Record<string, string[]>>((map, target) => {
    (map[target.vaccineId] ??= []).push(target.diseaseId);
    return map;
  }, {});
  const stepCountByProgram = steps.reduce<Record<string, number>>((map, step) => {
    map[step.programId] = (map[step.programId] ?? 0) + 1;
    return map;
  }, {});

  return (
    <>
      <div className="w-full h-full overflow-y-auto p-4 md:p-6">
        <VStack spacing={4}>
          <div className="w-full">
            <h1 className="text-2xl font-semibold text-balance"><Trans>Vaccination Center</Trans></h1>
            <p className="mt-1 text-sm text-muted-foreground text-pretty"><Trans>Maintain health catalogs and reusable vaccination programs, then assign approved programs to individual flocks for planned-vs-actual traceability.</Trans></p>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
            <Card><CardHeader><CardTitle><Trans>Create vaccination program</Trans></CardTitle></CardHeader><CardContent><VaccinationProgramForm /></CardContent></Card>
            <Card><CardHeader><CardTitle><Trans>Vaccination programs</Trans></CardTitle></CardHeader><CardContent>
              {programs.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>No vaccination programs have been created yet.</Trans></p> : <div className="grid gap-2">{programs.map((program) => <div key={program.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-medium">{program.name}</div><div className="mt-1 text-xs text-muted-foreground"><TechnicalText>{program.code}</TechnicalText> · {program.flockType} · {program.status} · <span dir="ltr" className="tabular-nums">{stepCountByProgram[program.id] ?? 0}</span> <Trans>steps</Trans></div></div><Button asChild size="sm" variant="secondary"><Link to={`/x/poultry/vaccinations/${program.id}`}><Trans>Open program</Trans></Link></Button></div>)}</div>}
            </CardContent></Card>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 2xl:grid-cols-3">
            <Card><CardHeader><CardTitle><Trans>Disease catalog</Trans></CardTitle></CardHeader><CardContent><DiseaseCatalogForm /><div className="mt-5 border-t pt-4"><div className="grid gap-2">{diseases.map((disease) => <div key={disease.id} className="rounded-md border p-2 text-sm"><div className="font-medium"><TechnicalText>{disease.code}</TechnicalText> · {disease.name}</div><div className="mt-1 text-xs text-muted-foreground">{disease.pathogenType}{disease.scientificName ? <> · <TechnicalText>{disease.scientificName}</TechnicalText></> : null}</div></div>)}</div></div></CardContent></Card>

            <Card><CardHeader><CardTitle><Trans>Vaccine catalog</Trans></CardTitle></CardHeader><CardContent>
              {diseases.length === 0 ? <p className="mb-3 text-sm text-muted-foreground"><Trans>Add at least one disease before creating vaccine products.</Trans></p> : null}
              <VaccineCatalogForm diseases={diseases} />
              <div className="mt-5 grid gap-3 border-t pt-4">{vaccines.map((vaccine) => <details key={vaccine.id} className="rounded-md border p-2"><summary className="cursor-pointer list-none text-sm font-medium"><TechnicalText>{vaccine.code}</TechnicalText> · {vaccine.tradeName}</summary><div className="mt-2 text-xs text-muted-foreground">{vaccine.vaccineType}{vaccine.manufacturer ? ` · ${vaccine.manufacturer}` : ""}</div><div className="mt-2 flex flex-wrap gap-1">{(targetsByVaccine[vaccine.id] ?? []).map((diseaseId) => <span key={diseaseId} className="rounded border px-2 py-0.5 text-xs">{diseaseById[diseaseId]?.code ?? diseaseId}</span>)}</div><div className="mt-3"><AddVaccineDiseaseTargetForm vaccineId={vaccine.id} diseases={diseases} /></div></details>)}</div>
            </CardContent></Card>

            <Card><CardHeader><CardTitle><Trans>Drug catalog</Trans></CardTitle></CardHeader><CardContent><DrugCatalogForm /><div className="mt-5 grid gap-2 border-t pt-4">{drugs.map((drug) => <div key={drug.id} className="rounded-md border p-2 text-sm"><div className="font-medium"><TechnicalText>{drug.code}</TechnicalText> · {drug.tradeName}</div><div className="mt-1 text-xs text-muted-foreground">{drug.activeIngredient || "—"} · <Trans>Meat withdrawal</Trans>: <span dir="ltr" className="tabular-nums">{drug.meatWithdrawalDays ?? "—"}</span> d · <Trans>Egg withdrawal</Trans>: <span dir="ltr" className="tabular-nums">{drug.eggWithdrawalDays ?? "—"}</span> d</div></div>)}</div></CardContent></Card>
          </div>
        </VStack>
      </div>
      <Outlet />
    </>
  );
}
