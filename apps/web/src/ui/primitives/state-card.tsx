import type { HTMLAttributes, ReactNode } from "react";

type Tone = "default" | "soft";
type Size = "sm" | "md" | "lg";
type State = "empty" | "loading" | "error";

const containerClassName: Record<Tone, string> = {
  default:
    "rounded-xl border border-dashed border-[var(--divider)] bg-[var(--hover-overlay)]",
  soft: "rounded-2xl border border-dashed border-[var(--divider)] bg-[var(--hover-overlay)]",
};

const stateClassName: Record<State, string> = {
  empty: "",
  loading: "",
  error: "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]",
};

const paddingClassName: Record<Size, string> = {
  sm: "px-4 py-6",
  md: "px-5 py-10",
  lg: "px-6 py-16",
};

export function StateCard({
  icon,
  title,
  description,
  children,
  tone = "default",
  size = "md",
  state = "empty",
  skeletonLines = 2,
  className = "",
  ...rest
}: {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  tone?: Tone;
  size?: Size;
  state?: State;
  skeletonLines?: number;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const classes = [
    containerClassName[tone],
    stateClassName[state],
    paddingClassName[size],
    "text-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      {...rest}
      className={classes}
      aria-busy={state === "loading" ? true : rest["aria-busy"]}
      role={state === "loading" ? "status" : rest.role}
    >
      {state === "loading" ? (
        <div className="mx-auto flex max-w-xs flex-col items-center gap-2" aria-hidden="true">
          {Array.from({ length: skeletonLines }).map((_, index) => (
            <div
              key={index}
              className={`skeleton h-3 ${index === 0 ? "w-40" : "w-full"}`}
            />
          ))}
        </div>
      ) : null}
      {state !== "loading" && icon ? (
        <div className="mx-auto mb-4 flex w-fit">{icon}</div>
      ) : null}
      {state !== "loading" && title ? (
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      ) : null}
      {state !== "loading" && description ? (
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      {state !== "loading" ? children : null}
    </div>
  );
}
