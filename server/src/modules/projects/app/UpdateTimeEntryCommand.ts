import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../../tasks/domain/TaskRepository';
import { assertProjectAndTask } from './LogTimeEntryCommand';
import { ProjectRepository } from '../domain/ProjectRepository';
import { TimeEntry } from '../domain/TimeEntry';
import { TimeEntryRepository } from '../domain/TimeEntryRepository';

export type UpdateTimeEntryInput = {
    readonly projectId?: string;
    readonly taskId?: string | null;
    readonly date?: string;
    readonly minutes?: number;
    readonly note?: string | null;
};

export class UpdateTimeEntryCommand extends Command<TimeEntry | null> {
    constructor(
        readonly id: string,
        readonly input: UpdateTimeEntryInput,
    ) {
        super();
    }
}

export class UpdateTimeEntryCommandHandler implements RequestHandler<UpdateTimeEntryCommand, TimeEntry | null> {
    constructor(
        private readonly projects: ProjectRepository,
        private readonly entries: TimeEntryRepository,
        private readonly tasks: TaskRepository,
    ) {}

    async handle(command: UpdateTimeEntryCommand, identity: Identity): Promise<TimeEntry | null> {
        const { userId } = requireUserIdentity(identity);
        const entry = await this.entries.getTimeEntry(userId, command.id);
        if (!entry) return null;
        const nextProjectId = command.input.projectId ?? entry.projectId;
        const nextTaskId = command.input.taskId !== undefined ? command.input.taskId : entry.taskId;
        await assertProjectAndTask(userId, nextProjectId, nextTaskId, this.projects, this.tasks);
        entry.update(command.input);
        return this.entries.save(userId, entry);
    }
}
