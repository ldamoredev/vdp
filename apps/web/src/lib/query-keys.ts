export function createDomainQueryKeys<const TDomain extends string>(
  domain: TDomain,
) {
  return {
    all: [domain] as const,
    key: <const TParts extends readonly unknown[]>(...parts: TParts) =>
      [domain, ...parts] as const,
  };
}
