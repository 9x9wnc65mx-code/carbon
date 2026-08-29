import type { ComponentProps } from "react";

/** Keeps poultry/scientific identifiers readable inside Arabic RTL UI. */
export default function TechnicalText({ className, ...props }: ComponentProps<"bdi">) {
  return <bdi dir="ltr" className={className} {...props} />;
}
