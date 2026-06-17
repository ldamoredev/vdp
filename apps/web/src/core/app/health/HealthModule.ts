import type { Core, CoreModule } from "../../Core";
import type { HealthGateway } from "../../domain/health/HealthGateway";
import type { MedicalGateway } from "../../domain/health/medical/MedicalGateway";
import { HttpHealthGateway } from "../../infrastructure/http/HttpHealthGateway";
import { HttpMedicalGateway } from "../../infrastructure/http/HttpMedicalGateway";

import { ArchiveCounter, ArchiveCounterHandler } from "./ArchiveCounter";
import { ArchiveHabit, ArchiveHabitHandler } from "./ArchiveHabit";
import { CompleteGoal, CompleteGoalHandler } from "./CompleteGoal";
import { CompleteHabit, CompleteHabitHandler } from "./CompleteHabit";
import { CreateCounter, CreateCounterHandler } from "./CreateCounter";
import { CreateGoal, CreateGoalHandler } from "./CreateGoal";
import { CreateHabit, CreateHabitHandler } from "./CreateHabit";
import { DropGoal, DropGoalHandler } from "./DropGoal";
import { GetCountersOverview, GetCountersOverviewHandler } from "./GetCountersOverview";
import { GetGoalsOverview, GetGoalsOverviewHandler } from "./GetGoalsOverview";
import { GetHabitsOverview, GetHabitsOverviewHandler } from "./GetHabitsOverview";
import { GetMoodCheckIns, GetMoodCheckInsHandler } from "./GetMoodCheckIns";
import { GraduateGoal, GraduateGoalHandler } from "./GraduateGoal";
import { SaveMoodCheckIn, SaveMoodCheckInHandler } from "./SaveMoodCheckIn";
import { CreateMedicalRecord, CreateMedicalRecordHandler } from "./medical/CreateMedicalRecord";
import { DeleteAttachment, DeleteAttachmentHandler } from "./medical/DeleteAttachment";
import { DeleteMedicalRecord, DeleteMedicalRecordHandler } from "./medical/DeleteMedicalRecord";
import { GetMedicalRecords, GetMedicalRecordsHandler } from "./medical/GetMedicalRecords";
import { UpdateMedicalRecord, UpdateMedicalRecordHandler } from "./medical/UpdateMedicalRecord";
import { UploadAttachment, UploadAttachmentHandler } from "./medical/UploadAttachment";
import { RelapseCounter, RelapseCounterHandler } from "./RelapseCounter";
import { UncompleteHabit, UncompleteHabitHandler } from "./UncompleteHabit";

/**
 * Wires the health module into the Core: builds the gateway from the shared
 * HTTP client and registers every command/query handler on the bus. The
 * frontend analogue of the backend's HealthModuleRuntime. Accepts an injected
 * gateway for tests.
 */
export class HealthModule implements CoreModule {
  constructor(
    private readonly gateway?: HealthGateway,
    private readonly medicalGateway?: MedicalGateway,
  ) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpHealthGateway(core.httpClient);
    const medicalGateway = this.medicalGateway ?? new HttpMedicalGateway(core.httpClient);

    core.bus.registerHandler(GetHabitsOverview, () => new GetHabitsOverviewHandler(gateway));
    core.bus.registerHandler(CreateHabit, () => new CreateHabitHandler(gateway));
    core.bus.registerHandler(CompleteHabit, () => new CompleteHabitHandler(gateway));
    core.bus.registerHandler(UncompleteHabit, () => new UncompleteHabitHandler(gateway));
    core.bus.registerHandler(ArchiveHabit, () => new ArchiveHabitHandler(gateway));

    core.bus.registerHandler(GetCountersOverview, () => new GetCountersOverviewHandler(gateway));
    core.bus.registerHandler(CreateCounter, () => new CreateCounterHandler(gateway));
    core.bus.registerHandler(RelapseCounter, () => new RelapseCounterHandler(gateway));
    core.bus.registerHandler(ArchiveCounter, () => new ArchiveCounterHandler(gateway));

    core.bus.registerHandler(GetGoalsOverview, () => new GetGoalsOverviewHandler(gateway));
    core.bus.registerHandler(CreateGoal, () => new CreateGoalHandler(gateway));
    core.bus.registerHandler(CompleteGoal, () => new CompleteGoalHandler(gateway));
    core.bus.registerHandler(DropGoal, () => new DropGoalHandler(gateway));
    core.bus.registerHandler(GraduateGoal, () => new GraduateGoalHandler(gateway));

    core.bus.registerHandler(GetMoodCheckIns, () => new GetMoodCheckInsHandler(gateway));
    core.bus.registerHandler(SaveMoodCheckIn, () => new SaveMoodCheckInHandler(gateway));

    core.bus.registerHandler(GetMedicalRecords, () => new GetMedicalRecordsHandler(medicalGateway));
    core.bus.registerHandler(CreateMedicalRecord, () => new CreateMedicalRecordHandler(medicalGateway));
    core.bus.registerHandler(UpdateMedicalRecord, () => new UpdateMedicalRecordHandler(medicalGateway));
    core.bus.registerHandler(DeleteMedicalRecord, () => new DeleteMedicalRecordHandler(medicalGateway));
    core.bus.registerHandler(UploadAttachment, () => new UploadAttachmentHandler(medicalGateway));
    core.bus.registerHandler(DeleteAttachment, () => new DeleteAttachmentHandler(medicalGateway));
  }
}
