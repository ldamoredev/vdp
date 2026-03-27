import { Account, CreateAccountData, UpdateAccountData } from './Account';

export abstract class AccountRepository {
    abstract findAll(): Promise<Account[]>;
    abstract findById(id: string): Promise<Account | null>;
    abstract create(data: CreateAccountData): Promise<Account>;
    abstract update(id: string, data: UpdateAccountData): Promise<Account | null>;
    abstract delete(id: string): Promise<Account | null>;
}
