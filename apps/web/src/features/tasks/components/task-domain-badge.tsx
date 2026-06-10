import { domainBadge, domainLabel } from "@/lib/format";

interface TaskDomainBadgeProps {
  domain: string | null;
  className?: string;
}

export function TaskDomainBadge({ domain, className = "" }: TaskDomainBadgeProps) {
  if (!domain) return null;
  return (
    <span className={`badge text-[10px] ${domainBadge(domain)} ${className}`}>
      {domainLabel(domain)}
    </span>
  );
}
