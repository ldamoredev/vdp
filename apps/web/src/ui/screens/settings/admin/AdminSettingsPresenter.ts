import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { AppSettings } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { GetAppSettings } from "@/core/app/admin/GetAppSettings";
import { UpdateAppSettings } from "@/core/app/admin/UpdateAppSettings";
import type {
  AdminSettingKey,
  AdminSettingToggleViewModel,
  AdminSettingsViewModel,
} from "@/ui/models/admin/AdminSettingsViewModel";

const SETTING_COPY: Record<
  AdminSettingKey,
  { label: string; description: string }
> = {
  registrationEnabled: {
    label: "Registro de usuarios",
    description: "Permite crear cuentas nuevas desde la pantalla de registro.",
  },
  chatEnabledForUsers: {
    label: "Chat IA para usuarios",
    description: "Habilita los asistentes IA para cuentas normales.",
  },
};

const SETTING_ORDER: AdminSettingKey[] = [
  "registrationEnabled",
  "chatEnabledForUsers",
];

export class AdminSettingsPresenter extends PresenterBase<AdminSettingsViewModel> {
  private settings: AppSettings | null = null;
  private busy: Record<AdminSettingKey, boolean> = {
    registrationEnabled: false,
    chatEnabledForUsers: false,
  };
  private error: string | null = null;
  private isLoading = false;
  private isStarted = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): AdminSettingsViewModel {
    return this.buildModel();
  }

  start(): void {
    if (this.isStarted) return;
    this.isStarted = true;
    void this.load();
  }

  stop(): void {
    this.isStarted = false;
  }

  async toggleSetting(key: AdminSettingKey): Promise<void> {
    if (!this.settings || this.busy[key]) return;

    const nextValue = !this.settings[key];
    const patch: Partial<AppSettings> = { [key]: nextValue };
    this.busy[key] = true;
    this.error = null;
    this.refresh();

    try {
      this.settings = await this.core.execute(new UpdateAppSettings(patch));
      await this.load(false);
    } catch (error) {
      this.error = errorMessage(error, "No se pudo actualizar el ajuste.");
    } finally {
      this.busy[key] = false;
      this.refresh();
    }
  }

  private async load(showLoading = true): Promise<void> {
    if (showLoading) {
      this.isLoading = true;
      this.refresh();
    }

    try {
      this.settings = await this.core.execute(new GetAppSettings());
      this.error = null;
    } catch (error) {
      this.error = errorMessage(error, "No se pudieron cargar los ajustes.");
    } finally {
      if (showLoading) this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): AdminSettingsViewModel {
    return {
      visible: true,
      title: "Administracion",
      subtitle: "Controles globales del sistema",
      isLoading: this.isLoading,
      loadingLabel: "Cargando ajustes...",
      error: this.error,
      toggles: this.settings ? SETTING_ORDER.map((key) => this.toggleVM(key)) : [],
    };
  }

  private toggleVM(key: AdminSettingKey): AdminSettingToggleViewModel {
    const copy = SETTING_COPY[key];
    const enabled = Boolean(this.settings?.[key]);
    return {
      key,
      label: copy.label,
      description: copy.description,
      enabled,
      busy: this.busy[key],
      statusLabel: enabled ? "Activo" : "Pausado",
    };
  }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
