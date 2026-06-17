import { ModulePage } from "@/ui/primitives/module-page";
import { CountersSection } from "./counters/CountersSection";
import { GoalsSection } from "./goals/GoalsSection";
import { HabitsSection } from "./habits/HabitsSection";
import { HealthEventsProvider } from "./health-events-context";
import { WeightSection } from "./weight/WeightSection";

/**
 * Composes the three autonomous health sections. Each owns its presenter and
 * view model; they coordinate only through HealthEvents (a graduated goal
 * tells habits to reload).
 */
export function HealthScreen() {
  return (
    <HealthEventsProvider>
      <ModulePage width="3xl" spacing="8">
        <HabitsSection />
        <WeightSection />
        <GoalsSection />
        <CountersSection />
      </ModulePage>
    </HealthEventsProvider>
  );
}
