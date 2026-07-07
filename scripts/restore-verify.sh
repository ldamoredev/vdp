#!/usr/bin/env bash
# Verify a VDP backup by restoring it into a disposable local Postgres
# container and printing per-schema row counts.
#
# Usage:
#   ./scripts/restore-verify.sh <dump-file>
#
# Requires Docker only (pg_restore/psql run inside the container). The
# container is removed on exit, success or failure.
# See docs/operations/backup-restore.md for the full runbook.
set -euo pipefail

DUMP="${1:-}"
if [[ -z "${DUMP}" || ! -f "${DUMP}" ]]; then
    echo "Usage: ./scripts/restore-verify.sh <dump-file>" >&2
    exit 1
fi

IMAGE="${IMAGE:-pgvector/pgvector:pg17}"
CONTAINER="vdp-restore-verify-$$"

cleanup() { docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "Starting disposable Postgres (${CONTAINER})..."
docker run -d --name "${CONTAINER}" \
    -e POSTGRES_USER=verify -e POSTGRES_PASSWORD=verify -e POSTGRES_DB=vdp_verify \
    "${IMAGE}" >/dev/null

until docker exec "${CONTAINER}" pg_isready -U verify -d vdp_verify >/dev/null 2>&1; do
    sleep 1
done

echo "Restoring $(basename "${DUMP}")..."
docker cp "${DUMP}" "${CONTAINER}:/dump.bin"
# Schema-scoped dumps don't carry CREATE EXTENSION statements; the app schemas
# need these two (task embeddings use pgvector, defaults use pgcrypto).
docker exec "${CONTAINER}" psql -U verify -d vdp_verify -c \
    'CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS vector;' >/dev/null
# --no-owner: dump was taken without owners; --exit-on-error: fail loudly.
docker exec "${CONTAINER}" pg_restore -U verify -d vdp_verify --no-owner --exit-on-error /dump.bin

echo
echo "Row counts per table (exact):"
docker exec "${CONTAINER}" psql -U verify -d vdp_verify -tA -c "
    SELECT format('%s.%s: %s rows', t.table_schema, t.table_name,
        (xpath('/row/cnt/text()',
            query_to_xml(format('SELECT count(*) AS cnt FROM %I.%I', t.table_schema, t.table_name),
                         false, true, '')))[1]::text)
    FROM information_schema.tables t
    WHERE t.table_type = 'BASE TABLE'
      AND t.table_schema IN ('core','tasks','wallet','health','medical','projects','objectives','inbox')
    ORDER BY t.table_schema, t.table_name;
" | sed 's/^/  /'

USERS="$(docker exec "${CONTAINER}" psql -U verify -d vdp_verify -tA -c 'SELECT count(*) FROM core.users;')"
if [[ "${USERS}" -lt 1 ]]; then
    echo "Restore verification FAILED: core.users is empty" >&2
    exit 1
fi

echo
echo "Restore verified: ${USERS} user(s) present. Disposable container will be removed."
