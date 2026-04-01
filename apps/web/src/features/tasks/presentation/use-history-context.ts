"use client";

import {
  HistoryQueriesContext,
  HistoryActionsContext,
  type HistoryQueriesValue,
  type HistoryActionsValue,
} from "./history-context";
import { useRequiredContext } from "@/lib/react/use-required-context";

export function useHistoryData(): HistoryQueriesValue {
  return useRequiredContext(
    HistoryQueriesContext,
    "useHistoryData",
    "HistoryProvider",
  );
}

export function useHistoryActions(): HistoryActionsValue {
  return useRequiredContext(
    HistoryActionsContext,
    "useHistoryActions",
    "HistoryProvider",
  );
}
