import { VStack } from "@carbon/react";
import { msg } from "@lingui/core/macro";
import type { MetaFunction } from "react-router";
import { Outlet } from "react-router";
import { GroupedContentSidebar } from "~/components/Layout";
import { CollapsibleSidebarProvider } from "~/components/Layout/Navigation";
import { usePoultrySubmodules } from "~/modules/poultry";
import type { Handle } from "~/utils/handle";

export const meta: MetaFunction = () => {
  return [{ title: "AVIOS | Poultry Operations" }];
};

export const handle: Handle = {
  breadcrumb: msg`Poultry Operations`,
  to: "/x/poultry",
  module: "poultry"
};

export default function PoultryRoute() {
  const { groups } = usePoultrySubmodules();

  return (
    <CollapsibleSidebarProvider>
      <div className="grid grid-cols-[auto_1fr] w-full h-full">
        <GroupedContentSidebar groups={groups} exactMatch />
        <VStack spacing={0} className="h-full min-w-0">
          <Outlet />
        </VStack>
      </div>
    </CollapsibleSidebarProvider>
  );
}
