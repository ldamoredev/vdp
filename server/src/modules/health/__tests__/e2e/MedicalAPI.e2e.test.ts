import { count } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TestDatabase } from '../../../../test/test-database';
import { ALL_TEST_USERS, PRIMARY_TEST_USER, SECONDARY_TEST_USER, TEST_USER_ID_HEADER } from '../../../../test/testUsers';
import { fileBlobs } from '../../../common/infrastructure/storage/schema';
import { TestApp } from './TestApp';

const testDb = new TestDatabase();
const testApp = new TestApp();

beforeAll(async () => {
    await testDb.setup();
    await testApp.setup();
}, 30_000);

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

afterAll(async () => {
    await testApp.teardown();
});

function asUser(userId: string) {
    return { [TEST_USER_ID_HEADER]: userId };
}

function multipartFile(filename: string, contentType: string, content: Buffer) {
    const boundary = '----vdp-medical-test-boundary';
    const head = Buffer.from(
        [
            `--${boundary}`,
            `Content-Disposition: form-data; name="file"; filename="${filename}"`,
            `Content-Type: ${contentType}`,
            '',
            '',
        ].join('\r\n'),
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    return {
        payload: Buffer.concat([head, content, tail]),
        headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    };
}

async function countBlobs(): Promise<number> {
    const [row] = await testDb.query.select({ value: count() }).from(fileBlobs);
    return row.value;
}

describe('Medical API — E2E', () => {
    it('covers the private medical record loop with attachment upload, download, and cleanup', async () => {
        const created = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/health/medical/records',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {
                type: 'estudio',
                title: 'Laboratorio anual',
                recordDate: '2026-06-10',
                professional: 'Dra. Lopez',
                specialty: 'Clinica',
                notes: 'Ayunas',
            },
        });
        expect(created.statusCode).toBe(201);
        expect(created.json()).toMatchObject({
            type: 'estudio',
            title: 'Laboratorio anual',
            attachments: [],
        });
        const recordId = created.json().id;

        const otherList = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/health/medical/records',
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        expect(otherList.json().records).toHaveLength(0);

        const pdf = Buffer.from('%PDF-1.7\nfake medical pdf');
        const uploadBody = multipartFile('laboratorio.pdf', 'application/pdf', pdf);
        const uploaded = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/medical/records/${recordId}/attachments`,
            headers: { ...asUser(PRIMARY_TEST_USER.id), ...uploadBody.headers },
            payload: uploadBody.payload,
        });
        expect(uploaded.statusCode).toBe(201);
        expect(uploaded.json()).toMatchObject({
            recordId,
            filename: 'laboratorio.pdf',
            mimeType: 'application/pdf',
            sizeBytes: pdf.length,
        });
        expect(uploaded.json()).not.toHaveProperty('storageRef');
        const attachmentId = uploaded.json().id;

        const ownList = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/health/medical/records',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(ownList.json().records[0].attachments).toHaveLength(1);

        const downloaded = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/health/medical/records/${recordId}/attachments/${attachmentId}/download`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(downloaded.statusCode).toBe(200);
        expect(downloaded.headers['content-type']).toContain('application/pdf');
        expect(downloaded.rawPayload.equals(pdf)).toBe(true);

        const otherDownload = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/health/medical/records/${recordId}/attachments/${attachmentId}/download`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        expect(otherDownload.statusCode).toBe(404);

        const otherUpload = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/medical/records/${recordId}/attachments`,
            headers: { ...asUser(SECONDARY_TEST_USER.id), ...uploadBody.headers },
            payload: uploadBody.payload,
        });
        expect(otherUpload.statusCode).toBe(404);

        const deleted = await testApp.app.inject({
            method: 'DELETE',
            url: `/api/v1/health/medical/records/${recordId}`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(deleted.statusCode).toBe(204);
        expect(await countBlobs()).toBe(0);
    });
});
