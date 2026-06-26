import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { ArchiveClient } from "@/core/app/projects/ArchiveClient";
import { CreateClient } from "@/core/app/projects/CreateClient";
import { ListClients } from "@/core/app/projects/ListClients";
import { UpdateClient } from "@/core/app/projects/UpdateClient";
import { sortClients, type Client } from "@/core/domain/projects/Client";
import type { ClientManagerViewModel } from "@/ui/models/projects/ClientManagerViewModel";

export class ClientManagerPresenter extends PresenterBase<ClientManagerViewModel> {
  private clients: Client[] = [];
  private drafts = new Map<string, string>();
  private busyClientIds = new Set<string>();
  private isOpen = false;
  private isLoading = true;
  private newName = "";
  private isSaving = false;
  private error: string | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    /** Notifies the screen that the catalog changed so dependent selectors can refresh. */
    private readonly onChanged: () => void = () => {},
  ) {
    super(onChange);
  }

  protected initModel(): ClientManagerViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    this.error = null;
    this.refresh();
  }

  setNewName(name: string): void {
    this.newName = name;
    this.refresh();
  }

  setDraftName(id: string, name: string): void {
    this.drafts.set(id, name);
    this.refresh();
  }

  async createClient(): Promise<void> {
    const name = this.newName.trim();
    if (name.length === 0 || this.isSaving) return;
    this.isSaving = true;
    this.error = null;
    this.refresh();
    try {
      await this.core.execute(new CreateClient({ name }));
      this.newName = "";
      await this.load();
      this.onChanged();
    } catch {
      this.error = "No pudimos crear el cliente.";
    } finally {
      this.isSaving = false;
      this.refresh();
    }
  }

  async renameClient(id: string): Promise<void> {
    const current = this.clients.find((client) => client.id === id);
    const draft = (this.drafts.get(id) ?? current?.name ?? "").trim();
    if (!current || this.busyClientIds.has(id)) return;
    if (draft.length === 0 || draft === current.name) {
      this.drafts.delete(id); // revert empty/unchanged edits to the saved name
      this.refresh();
      return;
    }
    this.busyClientIds.add(id);
    this.refresh();
    try {
      await this.core.execute(new UpdateClient(id, { name: draft }));
      this.drafts.delete(id);
      await this.load();
      this.onChanged();
    } catch {
      this.drafts.delete(id); // revert to the saved name on failure
      this.error = "No pudimos renombrar el cliente.";
    } finally {
      this.busyClientIds.delete(id);
      this.refresh();
    }
  }

  async archiveClient(id: string): Promise<void> {
    if (this.busyClientIds.has(id)) return;
    this.busyClientIds.add(id);
    this.refresh();
    try {
      await this.core.execute(new ArchiveClient(id));
      this.drafts.delete(id);
      await this.load();
      this.onChanged();
    } catch {
      this.error = "No pudimos archivar el cliente.";
    } finally {
      this.busyClientIds.delete(id);
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      this.clients = sortClients(await this.core.execute(new ListClients()));
      this.error = null;
    } catch {
      this.error = "No pudimos cargar los clientes.";
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): ClientManagerViewModel {
    return {
      isOpen: this.isOpen,
      isLoading: this.isLoading,
      newName: this.newName,
      isSaving: this.isSaving,
      canSubmit: this.newName.trim().length > 0 && !this.isSaving,
      error: this.error,
      clients: this.clients.map((client) => ({
        id: client.id,
        draftName: this.drafts.get(client.id) ?? client.name,
        statusLabel: client.isActive ? "Activo" : "Archivado",
        isActive: client.isActive,
        isBusy: this.busyClientIds.has(client.id),
      })),
    };
  }
}
