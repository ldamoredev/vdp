import { AgentRepository } from '../common/base/agents/AgentRepository';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { FileStorage } from '../common/base/storage/FileStorage';
import { CreateHabitCommand, CreateHabitCommandHandler } from './app/CreateHabitCommand';
import { GetHabitsOverviewQuery, GetHabitsOverviewQueryHandler } from './app/GetHabitsOverviewQuery';
import { GetMoodCheckInsQuery, GetMoodCheckInsQueryHandler } from './app/GetMoodCheckInsQuery';
import { GetWeightTrendQuery, GetWeightTrendQueryHandler } from './app/GetWeightTrendQuery';
import { SaveMoodCheckInCommand, SaveMoodCheckInCommandHandler } from './app/SaveMoodCheckInCommand';
import { SaveWeightEntryCommand, SaveWeightEntryCommandHandler } from './app/SaveWeightEntryCommand';
import { CreateMedicalRecordCommand, CreateMedicalRecordCommandHandler } from './app/medical/CreateMedicalRecordCommand';
import { DeleteAttachmentCommand, DeleteAttachmentCommandHandler } from './app/medical/DeleteAttachmentCommand';
import { DeleteMedicalRecordCommand, DeleteMedicalRecordCommandHandler } from './app/medical/DeleteMedicalRecordCommand';
import { DownloadAttachmentQuery, DownloadAttachmentQueryHandler } from './app/medical/DownloadAttachmentQuery';
import { GetMedicalRecordsQuery, GetMedicalRecordsQueryHandler } from './app/medical/GetMedicalRecordsQuery';
import { UpdateMedicalRecordCommand, UpdateMedicalRecordCommandHandler } from './app/medical/UpdateMedicalRecordCommand';
import { UploadAttachmentCommand, UploadAttachmentCommandHandler } from './app/medical/UploadAttachmentCommand';
import { HabitRepository } from './domain/HabitRepository';
import { CounterRepository } from './domain/CounterRepository';
import { GoalRepository } from './domain/GoalRepository';
import { MoodCheckInRepository } from './domain/MoodCheckInRepository';
import { WeightRepository } from './domain/WeightRepository';
import { MedicalRepository } from './domain/medical/MedicalRepository';
import { HealthAgent } from './infrastructure/agent/HealthAgent';
import { HealthAgentController } from './infrastructure/routes/HealthAgentController';
import { HealthController } from './infrastructure/routes/HealthController';
import { MedicalController } from './infrastructure/routes/MedicalController';
import { ArchiveHabit } from './services/ArchiveHabit';
import { CompleteHabitDay } from './services/CompleteHabitDay';
import { CreateHabit } from './services/CreateHabit';
import { GetHabitsOverview } from './services/GetHabitsOverview';
import { UncompleteHabitDay } from './services/UncompleteHabitDay';
import { ArchiveCounter } from './services/ArchiveCounter';
import { CreateCounter } from './services/CreateCounter';
import { GetCountersOverview } from './services/GetCountersOverview';
import { RelapseCounter } from './services/RelapseCounter';
import { CompleteGoal } from './services/CompleteGoal';
import { CreateGoal } from './services/CreateGoal';
import { DropGoal } from './services/DropGoal';
import { GetGoalsOverview } from './services/GetGoalsOverview';
import { GraduateGoal } from './services/GraduateGoal';

export class HealthModuleRuntime {
    constructor(private deps: ModuleContext) {}

    registerServices(): void {
        this.deps.services.register(CreateHabit, () => new CreateHabit(this.habitRepository()));
        this.deps.services.register(GetHabitsOverview, () => new GetHabitsOverview(this.habitRepository()));
        this.deps.services.register(CompleteHabitDay, () =>
            new CompleteHabitDay(this.habitRepository(), this.deps.eventBus),
        );
        this.deps.services.register(UncompleteHabitDay, () =>
            new UncompleteHabitDay(this.habitRepository()),
        );
        this.deps.services.register(ArchiveHabit, () => new ArchiveHabit(this.habitRepository()));

        this.deps.services.register(CreateCounter, () => new CreateCounter(this.counterRepository()));
        this.deps.services.register(GetCountersOverview, () =>
            new GetCountersOverview(this.counterRepository(), this.deps.eventBus),
        );
        this.deps.services.register(RelapseCounter, () => new RelapseCounter(this.counterRepository()));
        this.deps.services.register(ArchiveCounter, () => new ArchiveCounter(this.counterRepository()));

        this.deps.services.register(CreateGoal, () => new CreateGoal(this.goalRepository()));
        this.deps.services.register(GetGoalsOverview, () =>
            new GetGoalsOverview(this.goalRepository(), this.deps.eventBus),
        );
        this.deps.services.register(CompleteGoal, () => new CompleteGoal(this.goalRepository()));
        this.deps.services.register(DropGoal, () => new DropGoal(this.goalRepository()));
        this.deps.services.register(GraduateGoal, () =>
            new GraduateGoal(this.goalRepository(), this.deps.services.get(CreateHabit)),
        );
    }

    registerHandlers(): void {
        this.deps.bus.registerHandler(GetHabitsOverviewQuery, () =>
            new GetHabitsOverviewQueryHandler(this.habitRepository()),
        );

        this.deps.bus.registerHandler(CreateHabitCommand, () =>
            new CreateHabitCommandHandler(this.habitRepository())
        );
        this.deps.bus.registerHandler(GetMoodCheckInsQuery, () =>
            new GetMoodCheckInsQueryHandler(this.moodCheckInRepository(), this.habitRepository()),
        );
        this.deps.bus.registerHandler(SaveMoodCheckInCommand, () =>
            new SaveMoodCheckInCommandHandler(this.moodCheckInRepository()),
        );
        this.deps.bus.registerHandler(GetWeightTrendQuery, () =>
            new GetWeightTrendQueryHandler(this.weightRepository()),
        );
        this.deps.bus.registerHandler(SaveWeightEntryCommand, () =>
            new SaveWeightEntryCommandHandler(this.weightRepository()),
        );

        this.registerMedicalHandlers();
    }

    registerEventHandlers(): void {
        // Health only emits events; the cross-domain reactions live in Tasks.
    }

    registerAgent(): void {
        this.deps.agentRegistry.register(
            new HealthAgent(
                this.deps.eventBus,
                this.deps.services,
                this.deps.repositories,
                this.deps.llmTraceService,
                this.deps.traceService,
                this.deps.agentProvider,
                this.deps.logger,
                this.deps.authContextStorage,
            ),
        );
    }

    createControllers() {
        return [
            new HealthController(this.deps.bus, this.deps.services),
            new MedicalController(this.deps.bus),
            new HealthAgentController(this.deps.agentRegistry, this.agentRepository(), this.deps.authContextStorage),
        ];
    }

    private registerMedicalHandlers(): void {
        const repo = this.medicalRepository();
        const storage = this.fileStorage();

        this.deps.bus.registerHandler(GetMedicalRecordsQuery, () => new GetMedicalRecordsQueryHandler(repo));
        this.deps.bus.registerHandler(CreateMedicalRecordCommand, () => new CreateMedicalRecordCommandHandler(repo));
        this.deps.bus.registerHandler(UpdateMedicalRecordCommand, () => new UpdateMedicalRecordCommandHandler(repo));
        this.deps.bus.registerHandler(DeleteMedicalRecordCommand, () =>
            new DeleteMedicalRecordCommandHandler(repo, storage),
        );
        this.deps.bus.registerHandler(UploadAttachmentCommand, () =>
            new UploadAttachmentCommandHandler(repo, storage),
        );
        this.deps.bus.registerHandler(DownloadAttachmentQuery, () =>
            new DownloadAttachmentQueryHandler(repo, storage),
        );
        this.deps.bus.registerHandler(DeleteAttachmentCommand, () =>
            new DeleteAttachmentCommandHandler(repo, storage),
        );
    }

    private habitRepository(): HabitRepository {
        return this.deps.repositories.get(HabitRepository);
    }

    private counterRepository(): CounterRepository {
        return this.deps.repositories.get(CounterRepository);
    }

    private goalRepository(): GoalRepository {
        return this.deps.repositories.get(GoalRepository);
    }

    private moodCheckInRepository(): MoodCheckInRepository {
        return this.deps.repositories.get(MoodCheckInRepository);
    }

    private weightRepository(): WeightRepository {
        return this.deps.repositories.get(WeightRepository);
    }

    private medicalRepository(): MedicalRepository {
        return this.deps.repositories.get(MedicalRepository);
    }

    private fileStorage(): FileStorage {
        return this.deps.repositories.get(FileStorage);
    }

    private agentRepository(): AgentRepository {
        return this.deps.repositories.get(AgentRepository);
    }
}
