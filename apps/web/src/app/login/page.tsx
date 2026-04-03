import { LoginPageClient } from "./login-page-client";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextParam = resolvedSearchParams?.next;
  const nextPath =
    typeof nextParam === "string" && nextParam.startsWith("/") ? nextParam : "/home";

  return <LoginPageClient nextPath={nextPath} />;
}
