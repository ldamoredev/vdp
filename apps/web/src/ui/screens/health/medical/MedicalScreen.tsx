import { useRef } from "react";
import { Download, FileText, LockKeyhole, Plus, Trash2, Upload } from "lucide-react";

import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import type { MedicalFormVM, MedicalRecordVM } from "@/ui/models/health/medical/MedicalViewModel";
import { useMedicalPresenter } from "./useMedicalPresenter";

export function MedicalScreen() {
  const presenter = useMedicalPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="4xl" spacing="6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{vm.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{vm.intro}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <LockKeyhole size={13} aria-hidden="true" />
            {vm.privacyNote}
          </p>
        </div>
        <button onClick={() => presenter.toggleForm()} className="btn-primary shrink-0">
          <Plus size={16} />
          {vm.addButtonLabel}
        </button>
      </div>

      {vm.form && <RecordForm vm={vm.form} presenter={presenter} />}

      {vm.isLoading ? (
        <StateCard size="lg" className="glass-card-static border-none" description="Cargando fichas..." />
      ) : vm.emptyState ? (
        <div className="glass-card-static border-none">
          <StateCard size="lg" title={vm.emptyState.title} description={vm.emptyState.body} />
        </div>
      ) : (
        <div className="space-y-4">
          {vm.records.map((record) => (
            <RecordCard key={record.id} vm={record} presenter={presenter} />
          ))}
        </div>
      )}
    </ModulePage>
  );
}

function RecordForm({
  vm,
  presenter,
}: {
  vm: MedicalFormVM;
  presenter: ReturnType<typeof useMedicalPresenter>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="glass-card-static animate-fade-in-up p-5">
      <h3 className="mb-4 text-sm font-semibold">Nueva ficha médica</h3>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.submit();
        }}
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            value={vm.type}
            onChange={(event) => presenter.setFormField("type", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
          >
            {vm.typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={vm.recordDate}
            onChange={(event) => presenter.setFormField("recordDate", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
            required
          />
          <input
            value={vm.specialty}
            onChange={(event) => presenter.setFormField("specialty", event.target.value)}
            placeholder="Especialidad"
            className="glass-input px-4 py-2.5 text-sm"
          />
        </div>

        <input
          value={vm.title}
          onChange={(event) => presenter.setFormField("title", event.target.value)}
          placeholder="Título (ej: Análisis de sangre)"
          className="glass-input w-full px-4 py-2.5 text-sm"
          required
        />
        <input
          value={vm.professional}
          onChange={(event) => presenter.setFormField("professional", event.target.value)}
          placeholder="Profesional (opcional)"
          className="glass-input w-full px-4 py-2.5 text-sm"
        />
        <textarea
          value={vm.notes}
          onChange={(event) => presenter.setFormField("notes", event.target.value)}
          placeholder="Notas (opcional)"
          className="glass-input min-h-20 w-full px-4 py-2.5 text-sm"
        />

        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">{vm.attachmentLabel}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{vm.attachmentHint}</p>
              {vm.selectedFileName && (
                <p className="mt-2 truncate text-xs text-[var(--foreground-muted)]">
                  {vm.selectedFileName}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={(event) => {
                  presenter.setPendingFile(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                <Upload size={14} />
                {vm.chooseFileLabel}
              </button>
              {vm.selectedFileName && (
                <button
                  type="button"
                  onClick={() => presenter.setPendingFile(null)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  {vm.clearFileLabel}
                </button>
              )}
            </div>
          </div>
        </div>

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

function RecordCard({
  vm,
  presenter,
}: {
  vm: MedicalRecordVM;
  presenter: ReturnType<typeof useMedicalPresenter>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="badge badge-muted">{vm.typeLabel}</span>
            <h3 className="truncate font-medium">{vm.title}</h3>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {vm.dateLabel}
            {vm.metaLabel ? ` · ${vm.metaLabel}` : ""}
          </p>
          {vm.notes && <p className="mt-2 text-sm text-[var(--foreground-muted)]">{vm.notes}</p>}
        </div>
        <button
          onClick={() => void presenter.deleteRecord(vm.id)}
          disabled={vm.isBusy}
          className="shrink-0 rounded-lg p-2 text-[var(--muted)] transition-all hover:bg-[var(--accent-red-glow)] hover:text-[var(--accent-red)] disabled:opacity-40"
          aria-label="Eliminar ficha"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-4 space-y-2 border-t border-[var(--glass-border)] pt-4">
        {vm.attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-[var(--hover-overlay)] px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={15} className="shrink-0 text-[var(--muted)]" />
              <span className="truncate text-sm">{attachment.filename}</span>
              <span className="shrink-0 text-xs text-[var(--muted)]">{attachment.sizeLabel}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <a
                href={attachment.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover-overlay-strong)] hover:text-[var(--foreground)]"
                aria-label="Descargar"
              >
                <Download size={15} />
              </a>
              <button
                onClick={() => void presenter.deleteAttachment(vm.id, attachment.id)}
                disabled={vm.isBusy}
                className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent-red-glow)] hover:text-[var(--accent-red)] disabled:opacity-40"
                aria-label="Eliminar adjunto"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <div>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void presenter.uploadFile(vm.id, file);
              event.target.value = "";
            }}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={vm.isUploading}
            className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
          >
            <Upload size={14} />
            {vm.isUploading ? "Subiendo..." : "Adjuntar archivo"}
          </button>
        </div>
      </div>
    </div>
  );
}
