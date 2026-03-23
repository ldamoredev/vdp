"use client";

import { useTasksDashboardModel } from "@/features/tasks/presentation/use-tasks-dashboard-model";
import { OperationalHeader } from "@/features/tasks/presentation/components/operational-header";
import { QuickCaptureForm } from "@/features/tasks/presentation/components/quick-capture-form";
import { PlanningSignal } from "@/features/tasks/presentation/components/planning-signal";
import { FocusRecommendation } from "@/features/tasks/presentation/components/focus-recommendation";
import { ExecutionQueue } from "@/features/tasks/presentation/components/execution-queue";
import { NextBestAction, RecoveryBoard, WeeklyRhythm } from "@/features/tasks/presentation/components/sidebar-cards";
import { DetailPanel } from "@/features/tasks/presentation/components/detail-panel";
import { ClarificationGate } from "@/features/tasks/presentation/components/clarification-gate";

export default function TasksDashboard() {
  const model = useTasksDashboardModel();

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <section className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
        <OperationalHeader
          completionRate={model.todayStats?.completionRate ?? 0}
          completed={model.todayStats?.completed ?? 0}
          total={model.todayStats?.total ?? 0}
          urgentTasks={model.urgentTasks}
          stuckTasks={model.stuckTasks}
          pendingTasks={model.pendingTasks}
          doneTasks={model.doneTasks}
          completionAverage={model.completionAverage}
          isCarryingOverAll={model.isCarryingOverAll}
          onCarryOverAll={model.carryOverAll}
        />

        <QuickCaptureForm
          newTitle={model.newTitle}
          setNewTitle={model.setNewTitle}
          newPriority={model.newPriority}
          setNewPriority={model.setNewPriority}
          newDomain={model.newDomain}
          setNewDomain={model.setNewDomain}
          domainOptions={model.domainOptions}
          isCreatingTask={model.isCreatingTask}
          onSubmit={model.handleCreate}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <PlanningSignal
          tone={model.planning.tone}
          headline={model.planning.headline}
          summary={model.planning.summary}
          recommendations={model.planning.recommendations}
          pendingCount={model.pendingTasks.length}
          urgentCount={model.urgentTasks.length}
          carryOverRate={model.carryOverRate?.rate ?? 0}
        />

        <FocusRecommendation
          focusTasks={model.planning.focusTasks}
          activeSelectedTaskId={model.activeSelectedTaskId}
          onOpenDetail={model.openBreakdownStudio}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <ExecutionQueue
          tasks={model.tasks}
          visibleTasks={model.visibleTasks}
          pendingTasks={model.pendingTasks}
          doneTasks={model.doneTasks}
          filter={model.filter}
          setFilter={model.setFilter}
          expandedTaskActions={model.expandedTaskActions}
          setExpandedTaskActions={model.setExpandedTaskActions}
          isTaskBusy={model.isTaskBusy}
          onComplete={model.completeTask}
          onCarryOver={model.carryOverTask}
          onDiscard={model.discardTask}
          onDelete={model.deleteTask}
          onOpenDetail={model.openBreakdownStudio}
        />

        <div className="space-y-6">
          <NextBestAction topTask={model.topTask} />

          <DetailPanel
            breakdownStudioRef={model.breakdownStudioRef}
            selectedTask={model.selectedTask}
            selectedTaskNotes={model.selectedTaskNotes}
            pendingTasks={model.pendingTasks}
            activeSelectedTaskId={model.activeSelectedTaskId}
            breakdownSuggestions={model.breakdownSuggestions}
            persistedSteps={model.persistedSteps}
            blockerNotes={model.blockerNotes}
            contextNotes={model.contextNotes}
            newBreakdownStep={model.newBreakdownStep}
            setNewBreakdownStep={model.setNewBreakdownStep}
            newTaskNote={model.newTaskNote}
            setNewTaskNote={model.setNewTaskNote}
            newTaskNoteType={model.newTaskNoteType}
            setNewTaskNoteType={model.setNewTaskNoteType}
            isAddingTaskNote={model.isAddingTaskNote}
            onOpenDetail={model.openBreakdownStudio}
            onAddNote={model.addTaskNote}
          />

          <RecoveryBoard
            pendingCount={model.review?.pending ?? model.pendingTasks.length}
            carryOverCount={model.pendingTasks.filter((t) => t.carryOverCount > 0).length}
            stuckCount={model.stuckTasks.length}
          />

          <WeeklyRhythm trend={model.trend} today={model.today} />
        </div>
      </section>

      {model.showClarificationGate && (
        <ClarificationGate
          reasons={model.draftClarification.reasons}
          examples={model.draftClarification.examples}
          clarificationOutcome={model.clarificationOutcome}
          setClarificationOutcome={model.setClarificationOutcome}
          clarificationNextStep={model.clarificationNextStep}
          setClarificationNextStep={model.setClarificationNextStep}
          onSubmitClarified={() => model.submitTask(true)}
          onSubmitAnyway={() => model.submitTask(true, false)}
          onClose={() => model.setShowClarificationGate(false)}
          onReplaceTitle={(example) => {
            model.setNewTitle(example);
            model.setShowClarificationGate(false);
          }}
        />
      )}
    </div>
  );
}
