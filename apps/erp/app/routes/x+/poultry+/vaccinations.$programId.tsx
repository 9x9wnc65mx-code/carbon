import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { Trans } from "@lingui/react/macro";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, Link, redirect, useLoaderData } from "react-router";
import {
  addVaccinationProgramStepDisease,
  createVaccinationProgramStep,
  getDiseaseCatalog,
  getVaccinationProgram,
  getVaccinationProgramStepDiseases,
  getVaccinationProgramSteps,
  getVaccineCatalog,
  updateVaccinationProgram,
  vaccinationProgramStepDiseaseValidator,
  vaccinationProgramStepValidator,
  vaccinationProgramValidator
} from "~/modules/poultry";
import {
  AddProgramStepDiseaseForm,
  VaccinationProgramForm,
  VaccinationProgramStepForm
} from "~/modules/poultry/ui/VaccinationForms";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  if (!params.programId) throw new Response("Vaccination program not found", { status: 404 });

  const [program, steps, diseases, stepDiseases, vaccines] = await Promise.all([
    getVaccinationProgram(client, companyId, params.programId),
    getVaccinationProgramSteps(client, companyId, params.programId),
    getDiseaseCatalog(client, companyId),
    getVaccinationProgramStepDiseases(client, companyId),
    getVaccineCatalog(client, companyId)
  ]);

  if (program.error || !program.data) {
    throw new Response("Vaccination program not found", { status: 404 });
  }

  return {
    program: program.data,
    steps: steps.data ?? [],
    diseases: diseases.data ?? [],
    stepDiseases: stepDiseases.data ?? [],
    vaccines: vaccines.data ?? []
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  if (!params.programId) throw new Response("Vaccination program not found", { status: 404 });
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "updateProgram") {
    const { client, companyId, userId } = await requirePermissions(request, { update: "production" });
    const validation = await validator(vaccinationProgramValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await updateVaccinationProgram(client, params.programId, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to update vaccination program")));
    throw redirect(`/x/poultry/vaccinations/${params.programId}`, await flash(request, success("Vaccination program updated")));
  }

  if (intent === "createProgramStep") {
    const { client, companyId, userId } = await requirePermissions(request, { create: "production" });
    const validation = await validator(vaccinationProgramStepValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createVaccinationProgramStep(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to add vaccination program step")));
    throw redirect(`/x/poultry/vaccinations/${params.programId}`, await flash(request, success("Vaccination schedule step added")));
  }

  if (intent === "addProgramStepDisease") {
    const { client, companyId, userId } = await requirePermissions(request, { create: "production" });
    const validation = await validator(vaccinationProgramStepDiseaseValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await addVaccinationProgramStepDisease(client, validation.data, { companyId, userId });
    if (result.error) return data({}, await flash(request, error(result.error, "Failed to add disease target")));
    throw redirect(`/x/poultry/vaccinations/${params.programId}`, await flash(request, success("Combined disease target added")));
  }

  return data({}, await flash(request, error(null, "Unsupported vaccination program action")));
}

export default function VaccinationProgramDetailRoute() {
  const { program, steps, diseases, stepDiseases, vaccines } = useLoaderData<typeof loader>();
  const diseaseById = Object.fromEntries(diseases.map((item) => [item.id, item]));
  const vaccineById = Object.fromEntries(vaccines.map((item) => [item.id, item]));
  const targetsByStep = stepDiseases.reduce<Record<string, string[]>>((map, target) => {
    (map[target.programStepId] ??= []).push(target.diseaseId);
    return map;
  }, {});
  const nextSequence = Math.max(0, ...steps.map((step) => step.sequenceNo)) + 1;

  return (
    <>
      <Link to="/x/poultry/vaccinations" aria-label="Close vaccination program" className="fixed inset-0 z-40 bg-background/70 backdrop-blur-[1px]" />
      <aside className="fixed inset-y-0 end-0 z-50 w-full max-w-4xl overflow-y-auto border-s bg-background p-4 shadow-xl md:p-6">
        <VStack spacing={4}>
          <div className="flex w-full items-start justify-between gap-4">
            <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground"><Trans>Vaccination Program</Trans></p><h2 className="mt-1 text-xl font-semibold">{program.name}</h2><p className="mt-1 text-sm text-muted-foreground"><TechnicalText>{program.code}</TechnicalText> · {program.flockType} · {program.status}</p></div>
            <Button asChild variant="secondary" size="sm"><Link to="/x/poultry/vaccinations"><Trans>Close</Trans></Link></Button>
          </div>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Program definition</Trans></CardTitle></CardHeader><CardContent><VaccinationProgramForm initial={program} /></CardContent></Card>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Add vaccination schedule step</Trans></CardTitle></CardHeader><CardContent><VaccinationProgramStepForm programId={program.id} diseases={diseases} vaccines={vaccines} nextSequence={nextSequence} /></CardContent></Card>

          <Card className="w-full"><CardHeader><CardTitle><Trans>Program schedule</Trans></CardTitle></CardHeader><CardContent>
            {steps.length === 0 ? <p className="text-sm text-muted-foreground"><Trans>No schedule steps have been added yet.</Trans></p> : <div className="grid gap-3">{steps.map((step) => {
              const vaccine = step.vaccineId ? vaccineById[step.vaccineId] : null;
              return <details key={step.id} className="rounded-lg border p-3 open:bg-muted/20"><summary className="cursor-pointer list-none"><span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span className="font-medium"><span className="me-2 tabular-nums" dir="ltr">#{step.sequenceNo}</span><Trans>Day</Trans> <span className="tabular-nums" dir="ltr">{step.targetAgeDays}</span> · {step.route}</span><span className="text-xs text-muted-foreground">{vaccine ? <><TechnicalText>{vaccine.code}</TechnicalText> · {vaccine.tradeName}</> : <Trans>Product chosen at administration</Trans>}</span></span></summary><div className="mt-3 flex flex-wrap gap-1">{(targetsByStep[step.id] ?? []).map((diseaseId) => <span key={diseaseId} className="rounded border px-2 py-1 text-xs"><TechnicalText>{diseaseById[diseaseId]?.code ?? diseaseId}</TechnicalText> · {diseaseById[diseaseId]?.name ?? ""}</span>)}</div><div className="mt-3"><AddProgramStepDiseaseForm programStepId={step.id} diseases={diseases} /></div>{step.notes ? <p className="mt-3 text-sm text-muted-foreground">{step.notes}</p> : null}</details>;
            })}</div>}
          </CardContent></Card>
        </VStack>
      </aside>
    </>
  );
}
