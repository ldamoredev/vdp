import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { GetWalletSnapshot, WalletSnapshot } from '../services/GetWalletSnapshot';

export class GetWalletSnapshotQuery extends Query<WalletSnapshot> {}

export class GetWalletSnapshotQueryHandler implements RequestHandler<GetWalletSnapshotQuery, WalletSnapshot> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(_query: GetWalletSnapshotQuery, identity: Identity): Promise<WalletSnapshot> {
        const { userId } = requireUserIdentity(identity);
        return new GetWalletSnapshot(this.transactions, this.categories).execute(userId);
    }
}
