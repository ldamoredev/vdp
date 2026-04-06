import { randomBytes, scrypt as scryptCb, timingSafeEqual, ScryptOptions } from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS: ScryptOptions = {
    N: 65536,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
};

function scrypt(password: string, salt: string, keylen: number, options: ScryptOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scryptCb(password, salt, keylen, options, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey);
        });
    });
}

export class PasswordService {
    async hash(password: string): Promise<string> {
        const salt = randomBytes(16).toString('hex');
        const derived = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
        return `${salt}:${derived.toString('hex')}`;
    }

    async verify(password: string, passwordHash: string): Promise<boolean> {
        const [salt, storedHash] = passwordHash.split(':');
        if (!salt || !storedHash) return false;

        const derived = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
        const stored = Buffer.from(storedHash, 'hex');

        if (stored.length !== derived.length) {
            return false;
        }

        return timingSafeEqual(stored, derived);
    }
}
