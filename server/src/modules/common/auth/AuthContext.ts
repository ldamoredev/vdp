export interface AuthContext {
    isAuthenticated: boolean;
    userId: string | null;
    sessionId: string | null;
    role: 'user' | null;
    email: string | null;
    displayName: string | null;
}
