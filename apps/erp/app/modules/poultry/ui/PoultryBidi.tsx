import type { ComponentProps } from "react";

export default function PoultryBidi(props: ComponentProps<"bdi">) {
  return <bdi dir="ltr" {...props} />;
}
