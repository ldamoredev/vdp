import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Contact, PeopleViewModel } from "@/ui/models/people/PeopleViewModel";

/**
 * Placeholder People screen presenter. The domain has no backend yet, so this
 * returns mocked contacts. When the People module is migrated to the Core, only
 * this presenter changes (load contacts via a gateway) — the view stays put.
 */
const MOCK_CONTACTS: readonly Contact[] = [
  {
    id: "1",
    name: "Mamá",
    circle: "familia",
    phone: "+5491100000001",
    telegram: "mama_tg",
    email: "mama@email.com",
    birthday: "28 Mar",
    lastContact: "Ayer",
    avatar: "M",
    notes: "Preguntarle por el turno del lunes",
  },
  {
    id: "2",
    name: "Nico",
    circle: "amigos",
    phone: "+5491100000002",
    telegram: "nico_dev",
    email: "nico@email.com",
    birthday: "03 Abr",
    lastContact: "Hace 3 días",
    avatar: "N",
    notes: "Me debe el libro de system design",
  },
  {
    id: "3",
    name: "Laura García",
    circle: "trabajo",
    phone: "+5491100000003",
    email: "laura.garcia@company.com",
    birthday: "15 Abr",
    lastContact: "Hace 1 semana",
    avatar: "L",
    notes: "Coordinamos la review del sprint el viernes",
  },
  {
    id: "4",
    name: "Papá",
    circle: "familia",
    phone: "+5491100000004",
    telegram: "papa_tg",
    email: "papa@email.com",
    birthday: "22 Abr",
    lastContact: "Hace 2 días",
    avatar: "P",
    notes: "Arreglar el wifi del depto cuando vaya",
  },
  {
    id: "5",
    name: "Cami",
    circle: "familia",
    phone: "+5491100000005",
    email: "cami@email.com",
    birthday: "01 May",
    lastContact: "Hace 2 semanas",
    avatar: "C",
    notes: "Cumple pronto — pensar regalo",
  },
  {
    id: "6",
    name: "Martín CTO",
    circle: "trabajo",
    phone: "+5491100000006",
    telegram: "martin_cto",
    email: "martin@startup.io",
    birthday: "12 Jun",
    lastContact: "Hoy",
    avatar: "MT",
    notes: "Hablamos sobre la propuesta de arquitectura",
  },
];

export class PeoplePresenter extends PresenterBase<PeopleViewModel> {
  constructor(onChange: ChangeFunc) {
    super(onChange);
  }

  protected initModel(): PeopleViewModel {
    return { contacts: MOCK_CONTACTS };
  }
}
