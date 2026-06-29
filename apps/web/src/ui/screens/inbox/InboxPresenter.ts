import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { CaptureInboxItem } from "@/core/app/inbox/CaptureInboxItem";
import { DiscardInboxItem } from "@/core/app/inbox/DiscardInboxItem";
import { ListInboxItems } from "@/core/app/inbox/ListInboxItems";
import { InboxItem, pendingInboxItems } from "@/core/domain/inbox/InboxItem";
import { formatTaskDate } from "@/lib/format";
import type { InboxViewModel } from "@/ui/models/inbox/InboxViewModel";

export class InboxPresenter extends PresenterBase<InboxViewModel> {
  private items: InboxItem[] = [];
  private draft = "";
  private isLoading = true;
  private isSaving = false;
  private error: string | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): InboxViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  setDraft(draft: string): void {
    this.draft = draft;
    this.refresh();
  }

  async capture(): Promise<void> {
    if (!this.canSubmit() || this.isSaving) return;
    this.isSaving = true;
    this.refresh();
    try {
      await this.core.execute(new CaptureInboxItem({ text: this.draft.trim() }));
      this.draft = "";
      await this.load();
    } catch {
      this.error = "No pudimos capturar la nota.";
    } finally {
      this.isSaving = false;
      this.refresh();
    }
  }

  async discard(id: string): Promise<void> {
    try {
      await this.core.execute(new DiscardInboxItem(id));
      await this.load();
    } catch {
      this.error = "No pudimos descartar la nota.";
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      this.items = await this.core.execute(new ListInboxItems());
      this.error = null;
    } catch {
      this.error = "No pudimos cargar tu bandeja.";
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private canSubmit(): boolean {
    return this.draft.trim().length > 0;
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): InboxViewModel {
    const pending = pendingInboxItems(this.items);
    return {
      isLoading: this.isLoading,
      error: this.error,
      draft: this.draft,
      isSaving: this.isSaving,
      canSubmit: this.canSubmit() && !this.isSaving,
      pendingCount: pending.length,
      items: pending.map((item) => ({
        id: item.id,
        text: item.text,
        note: item.note,
        capturedLabel: formatTaskDate(item.createdAt.slice(0, 10)),
      })),
    };
  }
}
