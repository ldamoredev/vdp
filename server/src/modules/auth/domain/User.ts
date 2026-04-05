export class User {
    constructor(
        public id: string,
        public displayName: string,
        public passwordHash: string,
        public role: string = 'user',
        public isActive: boolean = false,
        public lastLoginAt: Date,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}
}

export type UserSnapshot = {
    id: string;
    displayName: string;
    passwordHash: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
