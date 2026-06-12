import { createDomainQueryKeys } from "@/lib/query-keys";

const healthKeys = createDomainQueryKeys("health");

export const healthQueryKeys = {
  all: healthKeys.all,
  habits: healthKeys.key("habits"),
} as const;
