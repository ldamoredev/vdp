import { Query, RequestHandler } from '@nbottarini/cqbus';

import { GetSetupStatus } from '../services/GetSetupStatus';

export type SetupStatus = {
    hasUsers: boolean;
};

export class GetSetupStatusQuery extends Query<SetupStatus> {}

export class GetSetupStatusQueryHandler implements RequestHandler<GetSetupStatusQuery, SetupStatus> {
    constructor(private readonly getSetupStatus: Pick<GetSetupStatus, 'execute'>) {}

    async handle(): Promise<SetupStatus> {
        return this.getSetupStatus.execute();
    }
}
