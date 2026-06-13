import { createBrowserRouter } from "react-router";

import DomainError from "@/components/shell/domain-error";
import DomainLayout from "@/components/shell/domain-layout";
import NotFound from "@/components/shell/not-found";
import RootError from "@/components/shell/root-error";
import HealthPage from "@/pages/health-page";
import HomePage from "@/pages/home-page";
import LandingPage from "@/pages/landing-page";
import LoginPage from "@/pages/login-page";
import PeoplePage from "@/pages/people-page";
import ReviewPage from "@/pages/review-page";
import SettingsPage from "@/pages/settings-page";
import StudyPage from "@/pages/study-page";
import TasksHistoryPage from "@/pages/tasks-history-page";
import TasksPage from "@/pages/tasks-page";
import WalletAccountsPage from "@/pages/wallet-accounts-page";
import WalletCategoriesPage from "@/pages/wallet-categories-page";
import WalletInvestmentsPage from "@/pages/wallet-investments-page";
import WalletPage from "@/pages/wallet-page";
import WalletSavingsPage from "@/pages/wallet-savings-page";
import WalletStatsPage from "@/pages/wallet-stats-page";
import WalletTransactionNewPage from "@/pages/wallet-transaction-new-page";
import WalletTransactionsPage from "@/pages/wallet-transactions-page";
import WorkPage from "@/pages/work-page";

// Mirrors the former Next.js App Router tree one-to-one: / and /login are
// public; everything else renders inside the domain shell behind AuthGate.
export const router = createBrowserRouter([
  { path: "/", element: <LandingPage />, errorElement: <RootError /> },
  { path: "/login", element: <LoginPage />, errorElement: <RootError /> },
  {
    element: <DomainLayout />,
    errorElement: <RootError />,
    children: [
      {
        errorElement: <DomainError />,
        children: [
          { path: "/home", element: <HomePage /> },
          { path: "/tasks", element: <TasksPage /> },
          { path: "/tasks/history", element: <TasksHistoryPage /> },
          { path: "/wallet", element: <WalletPage /> },
          { path: "/wallet/accounts", element: <WalletAccountsPage /> },
          { path: "/wallet/categories", element: <WalletCategoriesPage /> },
          { path: "/wallet/investments", element: <WalletInvestmentsPage /> },
          { path: "/wallet/savings", element: <WalletSavingsPage /> },
          { path: "/wallet/stats", element: <WalletStatsPage /> },
          { path: "/wallet/transactions", element: <WalletTransactionsPage /> },
          { path: "/wallet/transactions/new", element: <WalletTransactionNewPage /> },
          { path: "/health", element: <HealthPage /> },
          { path: "/review", element: <ReviewPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/people", element: <PeoplePage /> },
          { path: "/work", element: <WorkPage /> },
          { path: "/study", element: <StudyPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
