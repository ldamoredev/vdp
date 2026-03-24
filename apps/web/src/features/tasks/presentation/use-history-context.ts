"use client";

import { useContext } from "react";
import {
  HistoryQueriesContext,
  HistoryActionsContext,
  type HistoryQueriesValue,
  type HistoryActionsValue,
} from "./history-context";

export function useHistoryData(): HistoryQueriesValue {
  const ctx = useContext(HistoryQueriesContext);
  if (!ctx) {
    throw new Error("useHistoryData must be used within a <HistoryProvider>");
  }
  return ctx;
}

export function useHistoryActions(): HistoryActionsValue {
  const ctx = useContext(HistoryActionsContext);
  if (!ctx) {
    throw new Error("useHistoryActions must be used within a <HistoryProvider>");
  }
  return ctx;
}
