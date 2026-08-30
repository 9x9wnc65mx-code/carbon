import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { now } from "@internationalized/date";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, Link, Outlet, redirect, useLoaderData } from "react-router";
import {
  addLabTestDiseaseTarget,
  createLabAccession,
  createLaboratory,
  createLabTestDefinition,
  createLabTestParameter,
  getDiseaseCatalog,
  getFarm,
  getFarms,
  getFlockCycle,
  getFlockCycles,
  getLaboratories,
  getLaboratory,
  getLabAccessions,
  getLabTestDefinitions,
  getLabTestDiseaseTargets,
  getLabTestParameters,
  getPoultryHouse,
  getPoultryHouses,
  labAccessionValidator,
  laboratoryValidator,
  labTestDefinitionValidator,
  labTestDiseaseTargetValidator,
  labTestParameterValidator,
  updateLaboratory,
  updateLabTestDefinition,
  utcDateTimeToFarmLocal
} from "~/modules/poultry";
import {
  LabAccessionForm,
  LaboratoryForm,
  LabTestDefinitionForm,
  LabTestDiseaseTargetForm,
  LabTestParameterForm
} from "~/modules/poultry/ui/LaboratoryForms";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";
import type { Handle } from "~/utils/handle";

export const handle: Handle = {
  breadcrumb: msg`Laboratory`,
  to: "/x/poultry/laboratories"
};

async function resolveAccessionTimeZone(
  client: any,
  companyId: string,
  laboratoryId: string,
  flockId?: string
) {
  if (flockId) {
    const flock = await getFlockCycle(client, companyId, flockId);
    if (flock.data) {
      const house = await getPoultryHouse(client, companyId, flock.data.houseId);
      if (house.data) {
        const farm = await getFarm(client, companyId, house.data.farmId);
        if (farm.data?.timezone) return farm.data.timezone;
      }
    }
  }
  const laboratory = await getLaboratory(client, companyId, laboratoryId);
  return laboratory.data?.timezone ?? "UTC";
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });

  const [
    laboratories,
    tests,
    parameters,
    targets,
    diseases,
    accessions,
    flocks,
    houses,
    farms
  ] = await Promise.all([
    getLaboratories(client, companyId),
    getLabTestDefinitions(client, companyId),
    getLabTestParameters(client, companyId),
    getLabTestDiseaseTargets(client, companyId),
    getDiseaseCatalog(client, companyId),
    getLabAccessions(client, companyId),
    getFlockCycles(client, companyId),
    getPoultryHouses(client, companyId),
    getFarms(client, companyId)
  ]);

  const labs = laboratories.data ?? [];
  const defaultTimeZone =
    labs.find((lab: any) => lab.status === "Active")?.timezone ?? "UTC";
  return {
    laboratories: labs,
    tests: tests.data ?? [],
    parameters: parameters.data ?? [],
    targets: targets.data ?? [],
    diseases: diseases.data ?? [],
    accessions: accessions.data ?? [],
    flocks: flocks.data ?? [],
    houses: houses.data ?? [],
    farms: farms.data ?? [],
    defaultDateTime: utcDateTimeToFarmLocal(
      now("UTC").toAbsoluteString(),
      defaultTimeZone
    )
  };
}

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "createLaboratory" || intent === "updateLaboratory") {
    const { client, companyId, userId } =
      intent === "updateLaboratory"
        ? await requirePermissions(request, { update: "production" })
        : await requirePermissions(request, { create: "production" });
    const validation = await validator(laboratoryValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result =
      intent === "updateLaboratory" && validation.data.id
        ? await updateLaboratory(
            client,
            validation.data.id,
            validation.data,
            { companyId, userId }
          )
        : await createLaboratory(client, validation.data, {
            companyId,
            userId
          });
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to save laboratory"))
      );
    }
    throw redirect(
      "/x/poultry/laboratories",
      await flash(request, success("Laboratory saved"))
    );
  }

  if (intent === "createTestDefinition" || intent === "updateTestDefinition") {
    const { client, companyId, userId } =
      intent === "updateTestDefinition"
        ? await requirePermissions(request, { update: "production" })
        : await requirePermissions(request, { create: "production" });
    const validation = await validator(labTestDefinitionValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const result =
      intent === "updateTestDefinition" && validation.data.id
        ? await updateLabTestDefinition(
            client,
            validation.data.id,
            validation.data,
            { companyId, userId }
          )
        : await createLabTestDefinition(client, validation.data, {
            companyId,
            userId
          });
    if (result.error) {
      return data(
        {},
        await flash(
          request,
          error(result.error, "Failed to save laboratory test")
        )
      );
    }
    throw redirect(
      "/x/poultry/laboratories",
      await flash(
        request,
        success(
          intent === "createTestDefinition"
            ? "Laboratory test draft created"
            : "Laboratory test updated"
        )
      )
    );
  }

  if (intent === "createTestParameter") {
    const { client, companyId, userId } = await requirePermissions(request, {
      create: "production"
    });
    const validation = await validator(labTestParameterValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const result = await createLabTestParameter(client, validation.data, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to add test parameter"))
      );
    }
    throw redirect(
      "/x/poultry/laboratories",
      await flash(request, success("Test parameter added"))
    );
  }

  if (intent === "addTestDiseaseTarget") {
    const { client, companyId, userId } = await requirePermissions(request, {
      create: "production"
    });
    const validation = await validator(labTestDiseaseTargetValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const result = await addLabTestDiseaseTarget(client, validation.data, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to add disease target"))
      );
    }
    throw redirect(
      "/x/poultry/laboratories",
      await flash(request, success("Disease target linked"))
    );
  }

  if (intent === "createAccession") {
    const { client, companyId, userId } = await requirePermissions(request, {
      create: "production"
    });
    const validation = await validator(labAccessionValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const sourceTimeZone = await resolveAccessionTimeZone(
      client,
      companyId,
      validation.data.laboratoryId,
      validation.data.flockId
    );
    const result = await createLabAccession(client, validation.data, {
      companyId,
      userId,
      sourceTimeZone
    });
    if (result.error || !result.data) {
      return data(
        {},
        await flash(
          request,
          error(result.error, "Failed to open laboratory accession")
        )
      );
    }
    throw redirect(
      `/x/poultry/laboratories/${result.data.id}`,
      await flash(request, success("Laboratory accession opened"))
    );
  }

  return data(
    {},
    await flash(request, error(null, "Unsupported laboratory action"))
  );
}

function StatusBadge({ value }: { value: string }) {
  const emphasized = ["Active", "Completed", "Received"].includes(value);
  const warning = ["Urgent", "STAT", "In Progress", "Draft"].includes(value);
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs ${
        emphasized
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
          : warning
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
            : "text-muted-foreground"
      }`}
    >
      {value}
    </span>
  );
}

export default function LaboratoryCenterRoute() {
  const {
    laboratories,
    tests,
    parameters,
    targets,
    diseases,
    accessions,
    flocks,
    houses,
    farms,
    defaultDateTime
  } = useLoaderData<typeof loader>();
  const labById = Object.fromEntries(laboratories.map((lab) => [lab.id, lab]));
  const flockById = Object.fromEntries(flocks.map((flock) => [flock.id, flock]));
  const houseById = Object.fromEntries(houses.map((house) => [house.id, house]));
  const farmById = Object.fromEntries(farms.map((farm) => [farm.id, farm]));
  const diseaseById = Object.fromEntries(
    diseases.map((disease) => [disease.id, disease])
  );
  const paramsByTest = parameters.reduce<
    Record<string, Record<string, any>[]>
  >((map, parameter) => {
    (map[parameter.testDefinitionId] ??= []).push(parameter);
    return map;
  }, {});
  const targetsByTest = targets.reduce<
    Record<string, Record<string, any>[]>
  >((map, target) => {
    (map[target.testDefinitionId] ??= []).push(target);
    return map;
  }, {});

  return (
    <>
      <div className="h-full w-full overflow-y-auto p-4 md:p-6">
        <VStack spacing={4}>
          <div className="w-full">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-balance">
                  <Trans>Laboratory Center</Trans>
                </h1>
                <p className="mt-1 max-w-4xl text-sm text-muted-foreground text-pretty">
                  <Trans>
                    Configure laboratories and test schemas, accession samples,
                    preserve parameter snapshots, enter results and maintain
                    verification-grade traceability across the poultry digital
                    thread.
                  </Trans>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-md border px-2 py-1">
                  <Trans>Laboratories</Trans>: {" "}
                  <span dir="ltr" className="tabular-nums">
                    {laboratories.length}
                  </span>
                </span>
                <span className="rounded-md border px-2 py-1">
                  <Trans>Active tests</Trans>: {" "}
                  <span dir="ltr" className="tabular-nums">
                    {tests.filter((test) => test.status === "Active").length}
                  </span>
                </span>
                <span className="rounded-md border px-2 py-1">
                  <Trans>Open accessions</Trans>: {" "}
                  <span dir="ltr" className="tabular-nums">
                    {
                      accessions.filter(
                        (accession) =>
                          !["Completed", "Rejected", "Cancelled"].includes(
                            accession.status
                          )
                      ).length
                    }
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 2xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Open sample accession</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LabAccessionForm
                  laboratories={laboratories}
                  flocks={flocks}
                  defaultDateTime={defaultDateTime}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Accession queue</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    <Trans>No laboratory accessions have been created yet.</Trans>
                  </p>
                ) : (
                  <div className="grid max-h-[520px] gap-2 overflow-y-auto pe-1">
                    {accessions.map((accession) => {
                      const flock = accession.flockId
                        ? flockById[accession.flockId]
                        : null;
                      const house = flock ? houseById[flock.houseId] : null;
                      const farm = house ? farmById[house.farmId] : null;
                      return (
                        <div
                          key={accession.id}
                          className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">
                                <TechnicalText>
                                  {accession.accessionNumber}
                                </TechnicalText>
                              </span>
                              <StatusBadge value={accession.status} />
                              <StatusBadge value={accession.priority} />
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {labById[accession.laboratoryId]?.name ??
                                accession.laboratoryId}
                              {" · "}
                              {accession.sourceType}
                              {flock ? (
                                <>
                                  {" · "}
                                  <TechnicalText>{flock.code}</TechnicalText>
                                  {farm ? ` · ${farm.name}` : ""}
                                </>
                              ) : accession.sourceReference ? (
                                <>
                                  {" · "}
                                  <TechnicalText>
                                    {accession.sourceReference}
                                  </TechnicalText>
                                </>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              <span dir="ltr" className="tabular-nums">
                                {accession.collectedAt}
                              </span>
                              {" · "}
                              <TechnicalText>
                                {accession.sourceTimeZone}
                              </TechnicalText>
                            </div>
                          </div>
                          <Button asChild size="sm" variant="secondary">
                            <Link
                              to={`/x/poultry/laboratories/${accession.id}`}
                            >
                              <Trans>Open workspace</Trans>
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 2xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Laboratories</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <details className="rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">
                    <Trans>Create laboratory</Trans>
                  </summary>
                  <div className="mt-4">
                    <LaboratoryForm />
                  </div>
                </details>
                <div className="mt-4 grid gap-2">
                  {laboratories.map((lab) => (
                    <details
                      key={lab.id}
                      className="rounded-lg border p-3 open:bg-muted/20"
                    >
                      <summary className="cursor-pointer list-none">
                        <span className="flex items-center justify-between gap-3">
                          <span>
                            <span className="font-medium">
                              <TechnicalText>{lab.code}</TechnicalText>
                              {" · "}
                              {lab.name}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {lab.laboratoryType}
                              {" · "}
                              <TechnicalText>{lab.timezone}</TechnicalText>
                              {lab.accreditation
                                ? ` · ${lab.accreditation}`
                                : ""}
                            </span>
                          </span>
                          <StatusBadge value={lab.status} />
                        </span>
                      </summary>
                      <div className="mt-4 border-t pt-4">
                        <LaboratoryForm initial={lab} />
                      </div>
                    </details>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Test definitions & parameters</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <details className="rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">
                    <Trans>Create test definition</Trans>
                  </summary>
                  <div className="mt-4">
                    <LabTestDefinitionForm laboratories={laboratories} />
                  </div>
                </details>
                <div className="mt-4 grid gap-2">
                  {tests.map((test) => {
                    const testParameters = paramsByTest[test.id] ?? [];
                    const testTargets = targetsByTest[test.id] ?? [];
                    return (
                      <details
                        key={test.id}
                        className="rounded-lg border p-3 open:bg-muted/20"
                      >
                        <summary className="cursor-pointer list-none">
                          <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                              <span className="font-medium">
                                <TechnicalText>{test.code}</TechnicalText>
                                {" · "}
                                {test.name}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {labById[test.laboratoryId]?.name ??
                                  test.laboratoryId}
                                {" · "}
                                {test.category}
                                {test.method ? ` · ${test.method}` : ""}
                              </span>
                            </span>
                            <span className="flex gap-2">
                              <span className="rounded border px-2 py-1 text-xs">
                                <span dir="ltr">{testParameters.length}</span>{" "}
                                <Trans>parameters</Trans>
                              </span>
                              <StatusBadge value={test.status} />
                            </span>
                          </span>
                        </summary>
                        <div className="mt-4 grid gap-4 border-t pt-4">
                          <LabTestDefinitionForm
                            laboratories={laboratories}
                            initial={test}
                          />
                          <div className="rounded-lg border p-3">
                            <div className="mb-3 font-medium">
                              <Trans>Parameter schema</Trans>
                            </div>
                            {testParameters.length === 0 ? (
                              <p className="mb-3 text-sm text-muted-foreground">
                                <Trans>
                                  No parameters defined. Add at least one active
                                  parameter before activating this test.
                                </Trans>
                              </p>
                            ) : (
                              <div className="mb-4 overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/50 text-xs">
                                    <tr>
                                      <th className="p-2 text-start">
                                        <Trans>Seq</Trans>
                                      </th>
                                      <th className="p-2 text-start">
                                        <Trans>Parameter</Trans>
                                      </th>
                                      <th className="p-2 text-start">
                                        <Trans>Type</Trans>
                                      </th>
                                      <th className="p-2 text-start">
                                        <Trans>Unit / reference</Trans>
                                      </th>
                                      <th className="p-2 text-start">
                                        <Trans>Status</Trans>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {testParameters.map((parameter) => (
                                      <tr key={parameter.id} className="border-t">
                                        <td className="p-2" dir="ltr">
                                          {parameter.sequenceNo}
                                        </td>
                                        <td className="p-2">
                                          <TechnicalText>
                                            {parameter.code}
                                          </TechnicalText>
                                          {" · "}
                                          {parameter.name}
                                        </td>
                                        <td className="p-2">
                                          {parameter.resultType}
                                        </td>
                                        <td className="p-2">
                                          <span dir="ltr">
                                            {parameter.unit ?? "—"}
                                          </span>
                                          {parameter.referenceText
                                            ? ` · ${parameter.referenceText}`
                                            : ""}
                                        </td>
                                        <td className="p-2">
                                          {parameter.status}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {test.status !== "Archived" ? (
                              <LabTestParameterForm
                                testDefinitionId={test.id}
                                nextSequence={
                                  Math.max(
                                    0,
                                    ...testParameters.map(
                                      (parameter) =>
                                        Number(parameter.sequenceNo) || 0
                                    )
                                  ) + 1
                                }
                              />
                            ) : null}
                          </div>
                          <div className="rounded-lg border p-3">
                            <div className="mb-2 flex flex-wrap gap-2">
                              {testTargets.map((target) => (
                                <span
                                  key={`${test.id}-${target.diseaseId}`}
                                  className="rounded border px-2 py-1 text-xs"
                                >
                                  <TechnicalText>
                                    {diseaseById[target.diseaseId]?.code ??
                                      target.diseaseId}
                                  </TechnicalText>
                                  {" · "}
                                  {diseaseById[target.diseaseId]?.name ?? ""}
                                </span>
                              ))}
                            </div>
                            <LabTestDiseaseTargetForm
                              testDefinitionId={test.id}
                              diseases={diseases}
                            />
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </VStack>
      </div>
      <Outlet />
    </>
  );
}
