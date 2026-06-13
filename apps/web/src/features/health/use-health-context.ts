import {
  HealthActionsContext,
  HealthQueriesContext,
  type HealthActionsValue,
  type HealthQueriesValue,
} from "./health-context";
import { useRequiredContext } from "@/lib/use-required-context";

export function useHealthData(): HealthQueriesValue {
  return useRequiredContext(
    HealthQueriesContext,
    "useHealthData",
    "HealthProvider",
  );
}

export function useHealthActions(): HealthActionsValue {
  return useRequiredContext(
    HealthActionsContext,
    "useHealthActions",
    "HealthProvider",
  );
}
