export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly time: string;
  readonly duration: string;
  readonly type: "meeting" | "focus" | "break" | "deadline";
  readonly attendees?: readonly string[];
}

export interface EmailDraft {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

export interface WorkProject {
  readonly name: string;
  readonly pct: number;
  readonly accent: boolean;
}

export interface WorkViewModel {
  events: readonly CalendarEvent[];
  quickEmails: readonly EmailDraft[];
  projects: readonly WorkProject[];
}
