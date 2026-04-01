import type { ReactNode } from "react";

type HeaderPadding = "4" | "5";

const headerPaddingClassName: Record<HeaderPadding, string> = {
  "4": "p-4",
  "5": "p-5",
};

export function CollectionCard({
  title,
  icon,
  action,
  headerPadding = "5",
  bodyClassName = "divide-y divide-[var(--glass-border)]",
  children,
}: {
  title: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  headerPadding?: HeaderPadding;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div
        className={`flex items-center justify-between border-b border-[var(--glass-border)] ${headerPaddingClassName[headerPadding]}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
