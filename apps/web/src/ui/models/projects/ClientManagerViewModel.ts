export interface ClientRowVM {
  id: string;
  /** Controlled value for the rename input (edited draft if any, else the saved name). */
  draftName: string;
  statusLabel: string;
  isActive: boolean;
  isBusy: boolean;
}

export interface ClientManagerViewModel {
  isOpen: boolean;
  isLoading: boolean;
  newName: string;
  isSaving: boolean;
  canSubmit: boolean;
  error: string | null;
  clients: ClientRowVM[];
}
