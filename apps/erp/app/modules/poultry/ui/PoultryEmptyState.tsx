import { Trans } from "@lingui/react/macro";
import Empty from "~/components/Empty";

export default function PoultryEmptyState({ entity }: { entity: "farms" | "flocks" }) {
  return (
    <Empty>
      <p className="max-w-md text-center text-sm text-muted-foreground text-pretty">
        {entity === "farms" ? (
          <Trans>No poultry farms have been registered yet.</Trans>
        ) : (
          <Trans>No poultry flocks have been registered yet.</Trans>
        )}
      </p>
    </Empty>
  );
}
