import { TestDatabase } from './test-database';

const db = new TestDatabase();

export async function setup() {
    await db.setup();
}

export async function teardown() {
    await db.teardown();
    await db.destroy();
}
