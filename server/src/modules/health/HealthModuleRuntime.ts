import { AgentRepository } from '../common/base/agents/AgentRepository';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { HabitRepository } from './domain/HabitRepository';
import { CounterRepository } from './domain/CounterRepository';
import { HealthAgent } from './infrastructure/agent/HealthAgent';
import { HealthAgentController } from './infrastructure/routes/HealthAgentController';
import { HealthController } from './infrastructure/routes/HealthController';
import { ArchiveHabit } from './services/ArchiveHabit';
import { CompleteHabitDay } from './services/CompleteHabitDay';
import { CreateHabit } from './services/CreateHabit';
import { GetHabitsOverview } from './services/GetHabitsOverview';
import { UncompleteHabitDay } from './services/UncompleteHabitDay';
import { ArchiveCounter } from './services/ArchiveCounter';
import { CreateCounter } from './services/CreateCounter';
import { GetCountersOverview } from './services/GetCountersOverview';
import { RelapseCounter } from './services/RelapseCounter';

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
            new HealthController(this.deps.services),
            new HealthAgentController(this.deps.agentRegistry, this.agentRepository(), this.deps.authContextStorage),
        ];
    }

    private habitRepository(): HabitRepository {
        return this.deps.repositories.get(HabitRepository);
    }

    private counterRepository(): CounterRepository {
        return this.deps.repositories.get(CounterRepository);
    }

    private agentRepository(): AgentRepository {
        return this.deps.repositories.get(AgentRepository);
    }
}
