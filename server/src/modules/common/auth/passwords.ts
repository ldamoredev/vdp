import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer;
    return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    const [salt, storedHash] = passwordHash.split(':');
    if (!salt || !storedHash) return false;

    const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer;
    const stored = Buffer.from(storedHash, 'hex');

    if (stored.length !== derived.length) {
        return false;
    }

    return timingSafeEqual(stored, derived);
}
