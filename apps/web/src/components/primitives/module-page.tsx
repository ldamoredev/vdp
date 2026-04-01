import type { ReactNode } from "react";

type Width = "lg" | "3xl" | "4xl" | "5xl" | "6xl";
type Spacing = "6" | "8" | "10";

const widthClassName: Record<Width, string> = {
  lg: "max-w-lg",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

const spacingClassName: Record<Spacing, string> = {
  "6": "space-y-6",
  "8": "space-y-8",
  "10": "space-y-10",
};

export function ModulePage({
  width = "5xl",
  spacing = "8",
  className = "",
  children,
}: {
  width?: Width;
  spacing?: Spacing;
  className?: string;
  children: ReactNode;
}) {
  const classes = [
    widthClassName[width],
    spacingClassName[spacing],
    "animate-fade-in",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
