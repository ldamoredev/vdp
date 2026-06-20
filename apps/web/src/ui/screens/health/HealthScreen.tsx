import { HeartPulse } from "lucide-react";

import { ModuleHeader } from "@/ui/primitives/module-header";
import { ModulePage } from "@/ui/primitives/module-page";
import { BoardSection } from "@/ui/screens/tasks/board/BoardSection";
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
        <ModuleHeader
          eyebrow="Centro operativo"
          title="Health"
          icon={<HeartPulse size={20} />}
          description="Hábitos, peso, metas y contadores para cuidar el ritmo sin cargar culpa."
        />
        <HabitsSection />
        <WeightSection />
        <GoalsSection />
        <CountersSection />
        <BoardSection domain="health" />
      </ModulePage>
    </HealthEventsProvider>
  );
}
