import { createBrowserRouter } from "react-router";

import DomainError from "@/ui/shell/domain-error";
import DomainLayout from "@/ui/shell/domain-layout";
import NotFound from "@/ui/shell/not-found";
import RootError from "@/ui/shell/root-error";
import { HealthScreen } from "@/ui/screens/health/HealthScreen";
import HomeScreen from "@/ui/screens/home/HomeScreen";
import { MedicalScreen } from "@/ui/screens/health/medical/MedicalScreen";
import LandingScreen from "@/ui/screens/landing/LandingScreen";
import LoginScreen from "@/ui/screens/login/LoginScreen";
import { PeopleScreen } from "@/ui/screens/people/PeopleScreen";
import ReviewScreen from "@/ui/screens/review/ReviewScreen";
import SettingsScreen from "@/ui/screens/settings/SettingsScreen";
import { StudyScreen } from "@/ui/screens/study/StudyScreen";
import { HistoryScreen } from "@/ui/screens/tasks/history/HistoryScreen";
import { TasksDashboardScreen } from "@/ui/screens/tasks/dashboard/TasksDashboardScreen";
import { AccountsScreen } from "@/ui/screens/wallet/accounts/AccountsScreen";
import { CategoriesScreen } from "@/ui/screens/wallet/categories/CategoriesScreen";
import { DashboardScreen } from "@/ui/screens/wallet/dashboard/DashboardScreen";
import { InvestmentsScreen } from "@/ui/screens/wallet/investments/InvestmentsScreen";
import { RecurringScreen } from "@/ui/screens/wallet/recurring/RecurringScreen";
import { SavingsScreen } from "@/ui/screens/wallet/savings/SavingsScreen";
import { StatsScreen } from "@/ui/screens/wallet/stats/StatsScreen";
import { TransactionFormScreen } from "@/ui/screens/wallet/transactions/TransactionFormScreen";
import { TransactionsScreen } from "@/ui/screens/wallet/transactions/TransactionsScreen";
import { WorkScreen } from "@/ui/screens/work/WorkScreen";

// / and /login are public; everything else renders inside the domain shell
// behind AuthGate. Route elements are the screens under ui/screens/*.
export const router = createBrowserRouter([
  { path: "/", element: <LandingScreen />, errorElement: <RootError /> },
  { path: "/login", element: <LoginScreen />, errorElement: <RootError /> },
  {
    element: <DomainLayout />,
    errorElement: <RootError />,
    children: [
      {
        errorElement: <DomainError />,
        children: [
          { path: "/home", element: <HomeScreen /> },
          { path: "/tasks", element: <TasksDashboardScreen /> },
          { path: "/tasks/history", element: <HistoryScreen /> },
          { path: "/wallet", element: <DashboardScreen /> },
          { path: "/wallet/accounts", element: <AccountsScreen /> },
          { path: "/wallet/categories", element: <CategoriesScreen /> },
          { path: "/wallet/investments", element: <InvestmentsScreen /> },
          { path: "/wallet/recurring", element: <RecurringScreen /> },
          { path: "/wallet/savings", element: <SavingsScreen /> },
          { path: "/wallet/stats", element: <StatsScreen /> },
          { path: "/wallet/transactions", element: <TransactionsScreen /> },
          { path: "/wallet/transactions/new", element: <TransactionFormScreen /> },
          { path: "/health", element: <HealthScreen /> },
          { path: "/health/medical", element: <MedicalScreen /> },
          { path: "/review", element: <ReviewScreen /> },
          { path: "/settings", element: <SettingsScreen /> },
          { path: "/people", element: <PeopleScreen /> },
          { path: "/work", element: <WorkScreen /> },
          { path: "/study", element: <StudyScreen /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
