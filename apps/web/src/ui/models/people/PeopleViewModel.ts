export type ContactCircle = "familia" | "amigos" | "trabajo";

export interface Contact {
  readonly id: string;
  readonly name: string;
  readonly circle: ContactCircle;
  readonly phone: string;
  readonly telegram?: string;
  readonly email: string;
  readonly birthday: string;
  readonly lastContact: string;
  readonly avatar: string;
  readonly notes: string;
}

export interface PeopleViewModel {
  contacts: readonly Contact[];
}
