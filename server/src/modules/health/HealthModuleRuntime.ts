import { AgentRepository } from '../common/base/agents/AgentRepository';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { FileStorage } from '../common/base/storage/FileStorage';
import { ArchiveCounterCommand, ArchiveCounterCommandHandler } from './app/ArchiveCounterCommand';
import { ArchiveHabitCommand, ArchiveHabitCommandHandler } from './app/ArchiveHabitCommand';
import { CompleteGoalCommand, CompleteGoalCommandHandler } from './app/CompleteGoalCommand';
import { CompleteHabitDayCommand, CompleteHabitDayCommandHandler } from './app/CompleteHabitDayCommand';
import { CreateCounterCommand, CreateCounterCommandHandler } from './app/CreateCounterCommand';
import { CreateGoalCommand, CreateGoalCommandHandler } from './app/CreateGoalCommand';
import { CreateHabitCommand, CreateHabitCommandHandler } from './app/CreateHabitCommand';
import { DropGoalCommand, DropGoalCommandHandler } from './app/DropGoalCommand';
import { GetCountersOverviewQuery, GetCountersOverviewQueryHandler } from './app/GetCountersOverviewQuery';
import { GetGoalsOverviewQuery, GetGoalsOverviewQueryHandler } from './app/GetGoalsOverviewQuery';
import { GetHabitsOverviewQuery, GetHabitsOverviewQueryHandler } from './app/GetHabitsOverviewQuery';
import { GetMoodCheckInsQuery, GetMoodCheckInsQueryHandler } from './app/GetMoodCheckInsQuery';
import { GetWeightTrendQuery, GetWeightTrendQueryHandler } from './app/GetWeightTrendQuery';
import { GraduateGoalCommand, GraduateGoalCommandHandler } from './app/GraduateGoalCommand';
import { RelapseCounterCommand, RelapseCounterCommandHandler } from './app/RelapseCounterCommand';
import { SaveMoodCheckInCommand, SaveMoodCheckInCommandHandler } from './app/SaveMoodCheckInCommand';
import { SaveWeightEntryCommand, SaveWeightEntryCommandHandler } from './app/SaveWeightEntryCommand';
import { UncompleteHabitDayCommand, UncompleteHabitDayCommandHandler } from './app/UncompleteHabitDayCommand';
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

export class HealthModuleRuntime {
    constructor(private deps: ModuleContext) {}

    registerHandlers(): void {
        this.deps.bus.registerHandler(GetHabitsOverviewQuery, () =>
            new GetHabitsOverviewQueryHandler(this.habitRepository()),
        );

        this.deps.bus.registerHandler(CreateHabitCommand, () =>
            new CreateHabitCommandHandler(this.habitRepository())
        );
        this.deps.bus.registerHandler(CompleteHabitDayCommand, () =>
            new CompleteHabitDayCommandHandler(this.habitRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(UncompleteHabitDayCommand, () =>
            new UncompleteHabitDayCommandHandler(this.habitRepository()),
        );
        this.deps.bus.registerHandler(ArchiveHabitCommand, () =>
            new ArchiveHabitCommandHandler(this.habitRepository()),
        );
        this.deps.bus.registerHandler(GetCountersOverviewQuery, () =>
            new GetCountersOverviewQueryHandler(this.counterRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(CreateCounterCommand, () =>
            new CreateCounterCommandHandler(this.counterRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(RelapseCounterCommand, () =>
            new RelapseCounterCommandHandler(this.counterRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(ArchiveCounterCommand, () =>
            new ArchiveCounterCommandHandler(this.counterRepository()),
        );
        this.deps.bus.registerHandler(GetGoalsOverviewQuery, () =>
            new GetGoalsOverviewQueryHandler(this.goalRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(CreateGoalCommand, () =>
            new CreateGoalCommandHandler(this.goalRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(CompleteGoalCommand, () =>
            new CompleteGoalCommandHandler(this.goalRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(DropGoalCommand, () =>
            new DropGoalCommandHandler(this.goalRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(GraduateGoalCommand, () =>
            new GraduateGoalCommandHandler(this.goalRepository(), this.habitRepository(), this.deps.eventBus),
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
                this.deps.bus,
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
            new HealthController(this.deps.bus),
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
