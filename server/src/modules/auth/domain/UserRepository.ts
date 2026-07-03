import { UserRole } from '../../common/http/AuthContext';

export type UserRecord = {
    id: string;
    email: string;
    displayName: string;
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateUserData = {
    email: string;
    displayName: string;
    passwordHash: string;
    role?: UserRole;
};

export abstract class UserRepository {
    abstract countUsers(): Promise<number>;
    abstract findByEmail(email: string): Promise<UserRecord | null>;
    abstract findById(id: string): Promise<UserRecord | null>;
    abstract createUser(data: CreateUserData): Promise<UserRecord>;
    abstract updateLastLoginAt(id: string, lastLoginAt: Date): Promise<void>;
    abstract updateProfile(id: string, data: { displayName: string }): Promise<UserRecord | null>;
    abstract updatePasswordHash(id: string, passwordHash: string): Promise<void>;
}
