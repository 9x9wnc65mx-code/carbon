import { requirePermissions } from "@carbon/auth/auth.server";
import { getCarbonServiceRole } from "@carbon/auth/client.server";
import {
  Button,
  ClientOnly,
  Heading,
  Input,
  LoadingBars,
  SidebarTrigger,
  ToggleGroup,
  ToggleGroupItem,
  useLocalStorage
} from "@carbon/react";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMemo, useState } from "react";
import { LuKanban, LuList, LuSearch, LuTriangleAlert } from "react-icons/lu";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { OperationsList } from "~/components";
import type { Column, DisplaySettings, Item } from "~/components/Kanban";
import { Kanban } from "~/components/Kanban";
import { userContext } from "~/context";
import {
  getJobOperationsAssignedToEmployee,
  getWorkCentersByLocation
} from "~/services/operations.service";
import { makeDurations } from "~/utils/durations";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { companyId, userId } = await requirePermissions(request, {});

  const serviceRole = getCarbonServiceRole();
  const locationId = context.get(userContext)?.locationId;

  const [operations, workCenters] = await Promise.all([
    getJobOperationsAssignedToEmployee(serviceRole, userId, companyId),
    getWorkCentersByLocation(serviceRole, locationId)
  ]);

  return {
    operations: operations?.data?.map(makeDurations) ?? [],
    workCenters: workCenters?.data ?? []
  };
}

type AssignedView = "board" | "list";

const ASSIGNED_VIEW_KEY = "assigned-view";

const displaySettings: DisplaySettings = {
  emptyWorkCenters: false,
  showCustomer: false,
  showDescription: true,
  showDueDate: true,
  showDuration: true,
  showEmployee: false,
  showProgress: false,
  showStatus: true,
  showSalesOrder: true,
  showThumbnail: true
};

export default function AssignedRoute() {
  const { t } = useLingui();
  const { operations, workCenters } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useLocalStorage<AssignedView>(
    ASSIGNED_VIEW_KEY,
    "board"
  );

  const filteredOperations = useMemo(() => {
    if (!searchTerm) return operations;
    const lowercasedTerm = searchTerm.toLowerCase();
    return operations.filter(
      (operation) =>
        operation.description?.toLowerCase().includes(lowercasedTerm) ||
        operation.jobReadableId?.toLowerCase().includes(lowercasedTerm) ||
        operation.itemReadableId?.toLowerCase().includes(lowercasedTerm) ||
        operation.itemDescription?.toLowerCase().includes(lowercasedTerm)
    );
  }, [operations, searchTerm]);

  const { columns, items } = useMemo(() => {
    const activeWorkCenterIds = new Set<string>();
    const workCenterIdsWithOperations = new Set<string>();

    for (const operation of filteredOperations) {
      if (!operation.workCenterId) continue;
      workCenterIdsWithOperations.add(operation.workCenterId);
      if (operation.operationStatus === "In Progress") {
        activeWorkCenterIds.add(operation.workCenterId);
      }
    }

    // Only work centers with assigned operations become columns, so empty
    // work centers are always hidden on this board.
    const columns = Array.from(workCenterIdsWithOperations)
      .map((workCenterId) => {
        const workCenter = workCenters.find((wc) => wc.id === workCenterId);
        return {
          id: workCenterId,
          title: workCenter?.name ?? "",
          type: workCenter?.processes ?? [],
          active: activeWorkCenterIds.has(workCenterId),
          isBlocked: workCenter?.isBlocked ?? false,
          blockingDispatchId: workCenter?.blockingDispatchId ?? undefined,
          blockingDispatchReadableId:
            workCenter?.blockingDispatchReadableId ?? undefined
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title)) satisfies Column[];

    const items = filteredOperations
      .filter((operation) => Boolean(operation.workCenterId))
      .map((operation, index) => ({
        id: operation.id,
        assignee: operation.assignee,
        tags: operation.tags,
        columnId: operation.workCenterId,
        columnType: operation.processId,
        // the RPC orders by priority but does not return it
        priority: index,
        title: operation.jobReadableId,
        subtitle: operation.itemReadableId,
        description: operation.description,
        dueDate: operation.operationDueDate,
        duration:
          operation.setupDuration +
          Math.max(operation.laborDuration, operation.machineDuration),
        deadlineType: operation.jobDeadlineType,
        customerId: operation.jobCustomerId,
        operationQuantity: operation.operationQuantity,
        targetQuantity: operation.targetQuantity ?? operation.operationQuantity,
        jobReadableId: operation.jobReadableId,
        itemReadableId: operation.itemReadableId,
        itemDescription: operation.itemDescription,
        salesOrderReadableId: operation.salesOrderReadableId,
        salesOrderId: operation.salesOrderId,
        salesOrderLineId: operation.salesOrderLineId,
        status: operation.operationStatus,
        thumbnailPath: operation.thumbnailPath,
        quantity: operation.operationQuantity,
        quantityCompleted: operation.quantityComplete,
        quantityScrapped: operation.quantityScrapped,
        setupDuration: operation.setupDuration,
        laborDuration: operation.laborDuration,
        machineDuration: operation.machineDuration
      })) satisfies Item[];

    return { columns, items };
  }, [filteredOperations, workCenters]);

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="sticky top-0 z-10 flex h-[var(--header-height)] overflow-y-scroll scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background">
        <div className="flex items-center gap-2 px-2">
          <SidebarTrigger />
          <Heading size="h4">
            <Trans>Assigned to Me</Trans>
          </Heading>
        </div>
      </header>

      <main className="h-[calc(100dvh-var(--header-height))] w-full overflow-y-auto scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent">
        <div className="w-full p-4 h-[var(--header-height)]">
          <div className="relative">
            <div className="flex justify-between gap-4">
              <div className="flex flex-grow">
                <LuSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t`Search`}
                  className="pl-8"
                />
              </div>
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) => {
                  if (value) setView(value as AssignedView);
                }}
              >
                <ToggleGroupItem value="board" aria-label={t`Board view`}>
                  <LuKanban />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label={t`List view`}>
                  <LuList />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {filteredOperations.length > 0 ? (
          view === "board" ? (
            <ClientOnly
              fallback={
                <div className="flex w-full h-[calc(100%-var(--header-height))] items-center justify-center">
                  <LoadingBars />
                </div>
              }
            >
              {() => (
                <div className="flex flex-grow items-stretch overflow-hidden relative">
                  <div className="flex flex-1 min-h-full w-full relative">
                    <Kanban
                      columns={columns}
                      items={items}
                      {...displaySettings}
                    />
                  </div>
                </div>
              )}
            </ClientOnly>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,330px),1fr))] p-4 gap-4">
              <OperationsList operations={filteredOperations} />
            </div>
          )
        ) : searchTerm ? (
          <div className="flex flex-col flex-1 w-full h-[calc(100%-var(--header-height)*2)] items-center justify-center gap-4">
            <div className="flex justify-center items-center h-12 w-12 rounded-full bg-foreground text-background">
              <LuTriangleAlert className="h-6 w-6" />
            </div>
            <span className="text-xs font-mono font-light text-foreground uppercase">
              <Trans>No results exist</Trans>
            </span>
            <Button onClick={() => setSearchTerm("")}>
              <Trans>Clear Search</Trans>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 w-full h-[calc(100%-var(--header-height)*2)] items-center justify-center gap-4">
            <div className="flex justify-center items-center h-12 w-12 rounded-full bg-foreground text-background">
              <LuTriangleAlert className="h-6 w-6" />
            </div>
            <span className="text-xs font-mono font-light text-foreground uppercase">
              <Trans>No assigned operations</Trans>
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
