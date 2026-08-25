import type { AvatarProps } from "@carbon/react";
import {
  AvatarGroup,
  AvatarGroupList,
  AvatarOverflowIndicator,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@carbon/react";
import { getFaviconUrl } from "@carbon/utils";
import { useSuppliers } from "~/stores";
import Avatar from "./Avatar";

type SupplierAvatarGroupProps = AvatarProps & {
  supplierIds: string[];
  limit?: number;
};

const SupplierAvatarGroup = ({
  supplierIds,
  size,
  limit = 3,
  ...props
}: SupplierAvatarGroupProps) => {
  const [suppliers] = useSuppliers();

  const matched = suppliers.filter((supplier) =>
    supplierIds.includes(supplier.id)
  );

  if (matched.length === 0) {
    return null;
  }

  return (
    <AvatarGroup size={size ?? "xs"} limit={limit}>
      <AvatarGroupList>
        {matched.map((supplier) => (
          <Tooltip key={supplier.id}>
            <TooltipTrigger>
              <Avatar
                size={size ?? "xs"}
                name={supplier.name ?? undefined}
                imageUrl={
                  supplier.website ? getFaviconUrl(supplier.website) : undefined
                }
                {...props}
              />
            </TooltipTrigger>
            <TooltipContent>{supplier.name}</TooltipContent>
          </Tooltip>
        ))}
      </AvatarGroupList>
      <AvatarOverflowIndicator />
    </AvatarGroup>
  );
};

export default SupplierAvatarGroup;
