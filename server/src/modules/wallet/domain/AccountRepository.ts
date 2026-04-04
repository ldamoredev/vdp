import { Account, CreateAccountData, UpdateAccountData } from './Account';

export abstract class AccountRepository {
    abstract findAll(userId: string): Promise<Account[]>;
    abstract findById(userId: string, id: string): Promise<Account | null>;
    abstract create(userId: string, data: CreateAccountData): Promise<Account>;
    abstract update(userId: string, id: string, data: UpdateAccountData): Promise<Account | null>;
    abstract delete(userId: string, id: string): Promise<Account | null>;
}
