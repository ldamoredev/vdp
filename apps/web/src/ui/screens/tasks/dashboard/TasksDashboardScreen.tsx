import { ModulePage } from "@/components/primitives/module-page";
import { DetailPanel } from "./detail-panel/DetailPanel";
import { ExecutionQueue } from "./execution-queue/ExecutionQueue";
import { FocusRecommendation } from "./focus-recommendation/FocusRecommendation";
import { OperationalHeader } from "./operational-header/OperationalHeader";
import { PlanningSignal } from "./planning-signal/PlanningSignal";
import { QuickCapture } from "./quick-capture/QuickCapture";
import { SidebarCards } from "./sidebar-cards/SidebarCards";
import { TasksDashboardProvider } from "./tasks-dashboard-context";

export function TasksDashboardScreen() {
  return (
    <TasksDashboardProvider>
      <ModulePage width="6xl" spacing="8">
        <section className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <OperationalHeader />
          <QuickCapture />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <ExecutionQueue />
          <div className="space-y-6">
            <SidebarCards />
            <DetailPanel />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <PlanningSignal />
          <FocusRecommendation />
        </section>
      </ModulePage>
    </TasksDashboardProvider>
  );
}
