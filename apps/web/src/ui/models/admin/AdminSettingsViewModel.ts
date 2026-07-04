export type AdminSettingKey = "registrationEnabled" | "chatEnabledForUsers";

export interface AdminSettingToggleViewModel {
  key: AdminSettingKey;
  label: string;
  description: string;
  enabled: boolean;
  busy: boolean;
  statusLabel: string;
}

export interface AdminSettingsViewModel {
  visible: boolean;
  title: string;
  subtitle: string;
  isLoading: boolean;
  loadingLabel: string;
  error: string | null;
  toggles: AdminSettingToggleViewModel[];
}
