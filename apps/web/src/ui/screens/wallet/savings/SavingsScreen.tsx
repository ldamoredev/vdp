import { Calendar, Check, Plus, Target } from "lucide-react";

import { ModuleHeader } from "@/ui/primitives/module-header";
import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import type { SavingsFormVM, SavingsGoalVM } from "@/ui/models/wallet/SavingsViewModel";
import { WalletEmptyState } from "../components/wallet-empty-state";
import { useSavingsPresenter } from "./useSavingsPresenter";

export function SavingsScreen() {
  const presenter = useSavingsPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="4xl" spacing="6">
      <ModuleHeader
        eyebrow="Wallet"
        title={vm.title}
        icon={<Target size={20} />}
        description={vm.intro}
        actions={
          <button onClick={() => presenter.toggleForm()} className="btn-primary">
            <Plus size={16} />
            {vm.addButtonLabel}
          </button>
        }
      />

      {vm.form && <SavingsForm vm={vm.form} presenter={presenter} />}

      {vm.isLoading ? (
        <StateCard
          state="loading"
          size="lg"
          className="glass-card-static border-none"
          aria-label="Cargando metas"
        />
      ) : vm.emptyState ? (
        <div className="glass-card-static border-none">
          <WalletEmptyState {...vm.emptyState} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
          {vm.goals.map((goal) => (
            <SavingsGoalCard key={goal.id} vm={goal} presenter={presenter} />
          ))}
        </div>
      )}
    </ModulePage>
  );
}

function SavingsForm({
  vm,
  presenter,
}: {
  vm: SavingsFormVM;
  presenter: ReturnType<typeof useSavingsPresenter>;
}) {
  return (
    <div className="glass-card-static animate-fade-in-up p-5">
      <h3 className="mb-4 text-sm font-semibold">Crear meta de ahorro</h3>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.submit();
        }}
      >
        <input
          value={vm.name}
          onChange={(event) => presenter.setFormField("name", event.target.value)}
          placeholder="Ej: Fondo de emergencia"
          className="glass-input w-full px-4 py-2.5 text-sm"
          required
        />

        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            value={vm.targetAmount}
            onChange={(event) => presenter.setFormField("targetAmount", event.target.value)}
            placeholder="Monto objetivo"
            className="glass-input flex-1 px-4 py-2.5 text-sm"
            required
          />
          <select
            value={vm.currency}
            onChange={(event) => presenter.setFormField("currency", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
          >
            {vm.currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <input
          type="date"
          value={vm.deadline}
          onChange={(event) => presenter.setFormField("deadline", event.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        />

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={!vm.canSubmit}>
            {vm.submitLabel}
          </button>
          <button type="button" onClick={() => presenter.toggleForm()} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function SavingsGoalCard({
  vm,
  presenter,
}: {
  vm: SavingsGoalVM;
  presenter: ReturnType<typeof useSavingsPresenter>;
}) {
  return (
    <div className={`glass-card p-5 ${vm.isCompleted ? "glow-green" : ""}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)]">
            {vm.isCompleted ? (
              <Check size={18} className="text-[var(--accent-green)]" />
            ) : (
              <Target size={18} className="text-[var(--accent)]" />
            )}
          </div>
          <div>
            <h3 className="font-medium">{vm.name}</h3>
            {vm.hasDeadline ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Calendar size={12} />
                {vm.deadlineLabel}
              </p>
            ) : (
              <p className="mt-1 text-xs text-[var(--muted)]">{vm.deadlineLabel}</p>
            )}
          </div>
        </div>
        {vm.isCompleted && <span className="badge badge-green">Completado</span>}
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="truncate text-lg font-bold tracking-tight tabular-nums">{vm.currentLabel}</span>
          <span className="text-sm text-[var(--muted)]">de {vm.targetLabel}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${vm.progressPercent}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">{vm.progressLabel}</span>{" "}
          {vm.accumulatedLabel}
        </div>

        {vm.isContributing ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void presenter.submitContribution();
            }}
          >
            <input
              type="number"
              step="0.01"
              value={vm.contributeAmount}
              onChange={(event) => presenter.setContributeAmount(event.target.value)}
              placeholder="Monto"
              className="glass-input w-28 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="btn-primary px-3 py-2 text-sm"
              disabled={!vm.canSubmitContribution}
            >
              {vm.isSubmittingContribution ? "..." : "Aportar"}
            </button>
            <button
              type="button"
              onClick={() => presenter.cancelContribution()}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button onClick={() => presenter.startContribution(vm.id)} className="btn-secondary">
            Aportar
          </button>
        )}
      </div>
    </div>
  );
}
