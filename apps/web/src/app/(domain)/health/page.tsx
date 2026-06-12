"use client";

import { HealthProvider } from "@/features/health/health-context";
import { HabitsScreen } from "@/features/health/components/habits-screen";

export default function HealthPage() {
  return (
    <HealthProvider>
      <HabitsScreen />
    </HealthProvider>
  );
}
