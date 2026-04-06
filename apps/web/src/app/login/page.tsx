import { LoginPageClient } from "./login-page-client";
import { getLoginNotice } from "./auth-messages";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextParam = resolvedSearchParams?.next;
  const messageParam = resolvedSearchParams?.message;
  const nextPath =
    typeof nextParam === "string" &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.includes("://")
      ? nextParam
      : "/home";
  const notice = typeof messageParam === "string" ? getLoginNotice(messageParam) : "";

  return <LoginPageClient nextPath={nextPath} notice={notice} />;
}
