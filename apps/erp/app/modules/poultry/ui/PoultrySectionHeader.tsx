import { VStack } from "@carbon/react";
import type { ReactNode } from "react";

export default function PoultrySectionHeader({
  title,
  description
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <VStack spacing={1} className="w-full">
      <h1 className="text-2xl font-semibold text-balance">{title}</h1>
      {description ? (
        <p className="text-sm text-muted-foreground text-pretty">{description}</p>
      ) : null}
    </VStack>
  );
}
