import { assertIsPost, error, success } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import { validationError, validator } from "@carbon/form";
import { Button, Card, CardContent, CardHeader, CardTitle, VStack } from "@carbon/react";
import { now } from "@internationalized/date";
import { Trans } from "@lingui/react/macro";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, Link, redirect, useLoaderData } from "react-router";
import {
  createLabSpecimen,
  createLabTestOrder,
  enterLabResult,
  getFlockCycle,
  getLaboratory,
  getLabAccession,
  getLabResults,
  getLabSpecimens,
  getLabTestDefinitions,
  getLabTestOrders,
  labAccessionStatusValidator,
  labResultEntryValidator,
  labResultVerificationValidator,
  labSpecimenValidator,
  labTestOrderStatusValidator,
  labTestOrderValidator,
  updateLabAccessionStatus,
  updateLabTestOrderStatus,
  utcDateTimeToFarmLocal,
  verifyLabResult
} from "~/modules/poultry";
import {
  LabAccessionStatusForm,
  LabResultEntryForm,
  LabResultVerificationForm,
  LabSpecimenForm,
  LabTestOrderForm,
  LabTestOrderStatusForm
} from "~/modules/poultry/ui/LaboratoryForms";
import TechnicalText from "~/modules/poultry/ui/TechnicalText";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });
  if (!params.accessionId) {
    throw new Response("Laboratory accession not found", { status: 404 });
  }

  const accession = await getLabAccession(client, companyId, params.accessionId);
  if (accession.error || !accession.data) {
    throw new Response("Laboratory accession not found", { status: 404 });
  }

  const [laboratory, specimens, orders, tests] = await Promise.all([
    getLaboratory(client, companyId, accession.data.laboratoryId),
    getLabSpecimens(client, companyId, accession.data.id),
    getLabTestOrders(client, companyId, accession.data.id),
    getLabTestDefinitions(client, companyId, accession.data.laboratoryId)
  ]);
  const orderRows = orders.data ?? [];
  const resultResponse =
    orderRows.length > 0
      ? await getLabResults(
          client,
          companyId,
          orderRows.map((order) => order.id)
        )
      : { data: [] };
  const results = resultResponse.data ?? [];
  const flock = accession.data.flockId
    ? await getFlockCycle(client, companyId, accession.data.flockId)
    : { data: null };
  const timeZone =
    accession.data.sourceTimeZone ?? laboratory.data?.timezone ?? "UTC";

  return {
    accession: accession.data,
    laboratory: laboratory.data,
    flock: flock.data,
    specimens: specimens.data ?? [],
    orders: orderRows,
    tests: tests.data ?? [],
    results,
    defaultDateTime: utcDateTimeToFarmLocal(
      now("UTC").toAbsoluteString(),
      timeZone
    )
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  assertIsPost(request);
  if (!params.accessionId) {
    throw new Response("Laboratory accession not found", { status: 404 });
  }
  const formData = await request.formData();
  const intent = formData.get("_intent");
  const redirectTo = `/x/poultry/laboratories/${params.accessionId}`;

  if (intent === "createSpecimen" || intent === "createTestOrder") {
    const { client, companyId, userId } = await requirePermissions(request, {
      create: "production"
    });
    if (intent === "createSpecimen") {
      const validation = await validator(labSpecimenValidator).validate(formData);
      if (validation.error) return validationError(validation.error);
      const result = await createLabSpecimen(client, validation.data, {
        companyId,
        userId
      });
      if (result.error) {
        return data(
          {},
          await flash(request, error(result.error, "Failed to add specimen"))
        );
      }
      throw redirect(
        redirectTo,
        await flash(request, success("Specimen added"))
      );
    }
    const validation = await validator(labTestOrderValidator).validate(formData);
    if (validation.error) return validationError(validation.error);
    const result = await createLabTestOrder(client, validation.data, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to create test order"))
      );
    }
    throw redirect(
      redirectTo,
      await flash(
        request,
        success("Test order created and result worksheet generated")
      )
    );
  }

  const { client, companyId, userId } = await requirePermissions(request, {
    update: "production"
  });

  if (intent === "updateAccessionStatus") {
    const validation = await validator(labAccessionStatusValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const accession = await getLabAccession(
      client,
      companyId,
      params.accessionId
    );
    const sourceTimeZone = accession.data?.sourceTimeZone ?? "UTC";
    const result = await updateLabAccessionStatus(client, validation.data, {
      companyId,
      userId,
      sourceTimeZone
    });
    if (result.error) {
      return data(
        {},
        await flash(
          request,
          error(result.error, "Failed to update accession status")
        )
      );
    }
    throw redirect(
      redirectTo,
      await flash(request, success("Accession status updated"))
    );
  }

  if (intent === "enterResult") {
    const validation = await validator(labResultEntryValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const result = await enterLabResult(client, validation.data, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(
          request,
          error(result.error, "Failed to save laboratory result")
        )
      );
    }
    throw redirect(
      redirectTo,
      await flash(request, success("Laboratory result saved"))
    );
  }

  if (intent === "verifyResult") {
    const validation = await validator(labResultVerificationValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const result = await verifyLabResult(client, validation.data.resultId, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(
          request,
          error(result.error, "Failed to verify laboratory result")
        )
      );
    }
    throw redirect(
      redirectTo,
      await flash(request, success("Laboratory result verified and locked"))
    );
  }

  if (intent === "updateTestOrderStatus") {
    const validation = await validator(labTestOrderStatusValidator).validate(
      formData
    );
    if (validation.error) return validationError(validation.error);
    const result = await updateLabTestOrderStatus(client, validation.data, {
      companyId,
      userId
    });
    if (result.error) {
      return data(
        {},
        await flash(request, error(result.error, "Failed to update test order"))
      );
    }
    throw redirect(
      redirectTo,
      await flash(request, success("Test order updated"))
    );
  }

  return data(
    {},
    await flash(request, error(null, "Unsupported accession action"))
  );
}

function Badge({ value }: { value: string }) {
  const positive = ["Verified", "Completed", "Received", "Available"].includes(
    value
  );
  const attention = [
    "Pending",
    "Entered",
    "In Progress",
    "Requested",
    "Critical",
    "Abnormal"
  ].includes(value);
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs ${
        positive
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
          : attention
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
            : "text-muted-foreground"
      }`}
    >
      {value}
    </span>
  );
}

function resultValue(result: Record<string, any>) {
  if (result.numericValue != null) {
    return `${result.numericValue}${result.unitSnapshot ? ` ${result.unitSnapshot}` : ""}`;
  }
  if (result.booleanValue != null) return String(result.booleanValue);
  return result.textValue ?? result.qualitativeValue ?? "—";
}

export default function LaboratoryAccessionWorkspaceRoute() {
  const {
    accession,
    laboratory,
    flock,
    specimens,
    orders,
    tests,
    results,
    defaultDateTime
  } = useLoaderData<typeof loader>();
  const specimenById = Object.fromEntries(
    specimens.map((specimen) => [specimen.id, specimen])
  );
  const resultsByOrder = results.reduce<Record<string, Record<string, any>[]>>(
    (map, result) => {
      (map[result.testOrderId] ??= []).push(result);
      return map;
    },
    {}
  );
  const canReceive = ["Collected", "In Transit"].includes(accession.status);
  const canAddWork = !["Completed", "Rejected", "Cancelled"].includes(
    accession.status
  );

  return (
    <>
      <Link
        to="/x/poultry/laboratories"
        aria-label="Close laboratory accession"
        className="fixed inset-0 z-40 bg-background/70 backdrop-blur-[1px]"
      />
      <aside className="fixed inset-y-0 end-0 z-50 w-full max-w-5xl overflow-y-auto border-s bg-background p-4 shadow-xl md:p-6">
        <VStack spacing={4}>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Trans>Laboratory accession</Trans>
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                <TechnicalText>{accession.accessionNumber}</TechnicalText>
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge value={accession.status} />
                <Badge value={accession.priority} />
                {laboratory ? (
                  <span className="rounded-md border px-2 py-1 text-xs">
                    {laboratory.name}
                  </span>
                ) : null}
              </div>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link to="/x/poultry/laboratories">
                <Trans>Close</Trans>
              </Link>
            </Button>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <Trans>Chain of custody & source</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    <Trans>Source</Trans>
                  </div>
                  <div className="mt-1 font-medium">
                    {accession.sourceType}
                    {flock ? (
                      <>
                        {" · "}
                        <TechnicalText>{flock.code}</TechnicalText>
                      </>
                    ) : accession.sourceReference ? (
                      <>
                        {" · "}
                        <TechnicalText>{accession.sourceReference}</TechnicalText>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    <Trans>Collected</Trans>
                  </div>
                  <div className="mt-1 font-medium" dir="ltr">
                    {accession.collectedAt}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    <Trans>Received</Trans>
                  </div>
                  <div className="mt-1 font-medium" dir="ltr">
                    {accession.receivedAt ?? "—"}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">
                    <Trans>Timezone snapshot</Trans>
                  </div>
                  <div className="mt-1 font-medium">
                    <TechnicalText>{accession.sourceTimeZone}</TechnicalText>
                  </div>
                </div>
              </div>
              {accession.collectionNotes ? (
                <p className="mt-3 rounded-md border bg-muted/20 p-3 text-sm">
                  {accession.collectionNotes}
                </p>
              ) : null}
              {canReceive ? (
                <details className="mt-4 rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">
                    <Trans>Update receipt status</Trans>
                  </summary>
                  <div className="mt-4">
                    <LabAccessionStatusForm
                      accession={accession}
                      defaultDateTime={defaultDateTime}
                    />
                  </div>
                </details>
              ) : null}
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <Trans>Specimens</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {specimens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    <Trans>No specimens recorded.</Trans>
                  </p>
                ) : (
                  specimens.map((specimen) => (
                    <div
                      key={specimen.id}
                      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          <TechnicalText>{specimen.specimenCode}</TechnicalText>
                          {" · "}
                          {specimen.specimenType}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {specimen.anatomicalSite || "—"}
                          {specimen.poolSize ? (
                            <>
                              {" · "}
                              <Trans>Pool</Trans>{" "}
                              <span dir="ltr">{specimen.poolSize}</span>
                            </>
                          ) : null}
                          {specimen.conditionOnReceipt
                            ? ` · ${specimen.conditionOnReceipt}`
                            : ""}
                        </div>
                      </div>
                      <Badge value={specimen.status} />
                    </div>
                  ))
                )}
              </div>
              {canAddWork ? (
                <details className="mt-4 rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">
                    <Trans>Add specimen</Trans>
                  </summary>
                  <div className="mt-4">
                    <LabSpecimenForm accessionId={accession.id} />
                  </div>
                </details>
              ) : null}
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <Trans>Test orders & result verification</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canAddWork ? (
                <details className="mb-4 rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">
                    <Trans>Create test order</Trans>
                  </summary>
                  <div className="mt-4">
                    <LabTestOrderForm
                      accessionId={accession.id}
                      laboratoryId={accession.laboratoryId}
                      specimens={specimens}
                      tests={tests}
                    />
                  </div>
                </details>
              ) : null}
              <div className="grid gap-3">
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    <Trans>No test orders have been created.</Trans>
                  </p>
                ) : (
                  orders.map((order) => {
                    const orderResults = resultsByOrder[order.id] ?? [];
                    const pendingRequired = orderResults.filter(
                      (result) =>
                        result.isRequiredSnapshot && result.status !== "Verified"
                    ).length;
                    return (
                      <details
                        key={order.id}
                        className="rounded-lg border p-3 open:bg-muted/20"
                        open={orders.length === 1}
                      >
                        <summary className="cursor-pointer list-none">
                          <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                              <span className="font-medium">
                                <TechnicalText>{order.orderNumber}</TechnicalText>
                                {" · "}
                                {order.testNameSnapshot}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {specimenById[order.specimenId]?.specimenCode ??
                                  order.specimenId}
                                {" · "}
                                <TechnicalText>
                                  {order.testCodeSnapshot}
                                </TechnicalText>
                                {order.methodSnapshot
                                  ? ` · ${order.methodSnapshot}`
                                  : ""}
                              </span>
                            </span>
                            <span className="flex flex-wrap gap-2">
                              <span className="rounded border px-2 py-1 text-xs">
                                <span dir="ltr">{orderResults.length}</span>{" "}
                                <Trans>results</Trans>
                              </span>
                              {pendingRequired > 0 ? (
                                <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-700">
                                  <span dir="ltr">{pendingRequired}</span>{" "}
                                  <Trans>awaiting verification</Trans>
                                </span>
                              ) : null}
                              <Badge value={order.status} />
                            </span>
                          </span>
                        </summary>
                        <div className="mt-4 grid gap-4 border-t pt-4">
                          <div className="grid gap-3">
                            {orderResults.map((result) => (
                              <div
                                key={result.id}
                                className="rounded-lg border bg-background p-3"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <div className="font-medium">
                                      <TechnicalText>
                                        {result.parameterCodeSnapshot}
                                      </TechnicalText>
                                      {" · "}
                                      {result.parameterNameSnapshot}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      {result.resultTypeSnapshot}
                                      {result.referenceTextSnapshot
                                        ? ` · ${result.referenceTextSnapshot}`
                                        : ""}
                                      {result.referenceMinSnapshot != null ||
                                      result.referenceMaxSnapshot != null ? (
                                        <span dir="ltr">
                                          {" · ["}
                                          {result.referenceMinSnapshot ?? "—"}
                                          {" – "}
                                          {result.referenceMaxSnapshot ?? "—"}
                                          {"]"}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge value={result.status} />
                                    {result.resultFlag ? (
                                      <Badge value={result.resultFlag} />
                                    ) : null}
                                  </div>
                                </div>
                                {result.status === "Verified" ? (
                                  <div className="mt-3 flex flex-col gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <div className="font-medium" dir="ltr">
                                        {resultValue(result)}
                                      </div>
                                      <div className="mt-1 text-xs text-muted-foreground">
                                        <Trans>Verified at</Trans>{" "}
                                        <span dir="ltr">{result.verifiedAt}</span>
                                        {result.comment
                                          ? ` · ${result.comment}`
                                          : ""}
                                      </div>
                                    </div>
                                    <span className="text-xs font-medium text-emerald-700">
                                      <Trans>Locked audit result</Trans>
                                    </span>
                                  </div>
                                ) : (
                                  <div className="mt-3 grid gap-2">
                                    <LabResultEntryForm result={result} />
                                    {result.status === "Entered" ? (
                                      <div className="flex justify-end">
                                        <LabResultVerificationForm
                                          resultId={result.id}
                                        />
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {![
                            "Completed",
                            "Rejected",
                            "Cancelled"
                          ].includes(order.status) ? (
                            <details className="rounded-lg border p-3">
                              <summary className="cursor-pointer font-medium">
                                <Trans>Update test order status</Trans>
                              </summary>
                              <div className="mt-4">
                                <LabTestOrderStatusForm order={order} />
                              </div>
                            </details>
                          ) : null}
                        </div>
                      </details>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <Trans>Audit interpretation</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <Trans>
                  Result rows are generated from the active parameter schema when
                  a test is ordered. The parameter code, name, result type, unit,
                  reference range and qualitative options are snapshotted so later
                  catalog edits do not rewrite historical laboratory evidence.
                  Verified result values are immutable.
                </Trans>
              </p>
            </CardContent>
          </Card>
        </VStack>
      </aside>
    </>
  );
}
