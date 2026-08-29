import { useLingui } from "@lingui/react/macro";
import { LuBird, LuHouse, LuLayoutDashboard } from "react-icons/lu";
import { usePermissions } from "~/hooks";
import type { AuthenticatedRouteGroup } from "~/types";

const routes = {
  overview: "/x/poultry",
  farms: "/x/poultry/farms",
  flocks: "/x/poultry/flocks"
} as const;

export default function usePoultrySubmodules() {
  const { t } = useLingui();
  const permissions = usePermissions();

  const groups: AuthenticatedRouteGroup[] = [
    {
      name: t`Poultry Operations`,
      routes: [
        {
          name: t`Overview`,
          to: routes.overview,
          icon: <LuLayoutDashboard />,
          permission: "production"
        },
        {
          name: t`Farms`,
          to: routes.farms,
          icon: <LuHouse />,
          permission: "production"
        },
        {
          name: t`Flocks`,
          to: routes.flocks,
          icon: <LuBird />,
          permission: "production"
        }
      ]
    }
  ];

  const isRouteVisible = (route: AuthenticatedRouteGroup["routes"][number]) => {
    if (route.role && !permissions.is(route.role)) return false;
    if (route.permission && !permissions.can("view", route.permission)) {
      return false;
    }
    return true;
  };

  return {
    groups: groups
      .filter((group) => group.routes.some(isRouteVisible))
      .map((group) => ({
        ...group,
        routes: group.routes.filter(isRouteVisible)
      }))
  };
}
