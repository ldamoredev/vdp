import { LoginPageClient } from "./login-page-client";
import { getLoginNotice, resolvePostLoginPath } from "./auth-messages";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextParam = resolvedSearchParams?.next;
  const messageParam = resolvedSearchParams?.message;
  const nextPath = resolvePostLoginPath(nextParam);
  const notice = typeof messageParam === "string" ? getLoginNotice(messageParam) : "";

  return <LoginPageClient nextPath={nextPath} notice={notice} />;
}
