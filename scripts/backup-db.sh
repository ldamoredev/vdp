#!/usr/bin/env bash
# Dump the VDP database to a timestamped pg_dump custom-format archive.
#
# Usage:
#   DATABASE_URL='postgresql://...' ./scripts/backup-db.sh [backup-dir] [keep-n]
#
# pg_dump runs inside a Docker container (postgres:17 client), so no local
# Postgres client tools are required and client/server version mismatches
# cannot happen. Owner-run against prod (Supabase connection string), never
# from an agent session. See docs/operations/backup-restore.md.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL is required" >&2
    exit 1
fi

CLIENT_IMAGE="${CLIENT_IMAGE:-postgres:17}"
BACKUP_DIR="${1:-backups}"
KEEP_N="${2:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/vdp-${STAMP}.dump"

# Docker containers cannot reach the host's localhost directly.
DB_URL="${DATABASE_URL/localhost/host.docker.internal}"
DB_URL="${DB_URL/127.0.0.1/host.docker.internal}"
if [[ "${DB_URL}" != "${DATABASE_URL}" ]]; then
    echo "Note: rewrote localhost -> host.docker.internal for the Docker client."
fi

mkdir -p "${BACKUP_DIR}"

# Only VDP's schemas: everything the app owns lives here (first-party auth in
# core, file blobs in core.file_blobs, drizzle migration journal). Supabase-managed
# schemas (auth, storage, vault, extensions, ...) are not ours and their
# extensions don't exist outside Supabase, which would break restores.
VDP_SCHEMAS=(core tasks wallet health medical projects objectives inbox drizzle)
SCHEMA_FLAGS=()
for s in "${VDP_SCHEMAS[@]}"; do SCHEMA_FLAGS+=("--schema=${s}"); done

# Custom format (-Fc): compressed, restorable table-by-table with pg_restore.
# --no-owner/--no-privileges: restore must not depend on prod role names.
docker run --rm "${CLIENT_IMAGE}" \
    pg_dump "${DB_URL}" --format=custom --no-owner --no-privileges "${SCHEMA_FLAGS[@]}" > "${OUT}"

# Sanity: the archive must be listable and non-trivial.
ABS_OUT="$(cd "$(dirname "${OUT}")" && pwd)/$(basename "${OUT}")"
ENTRIES="$(docker run --rm -v "${ABS_OUT}:/dump.bin:ro" "${CLIENT_IMAGE}" \
    pg_restore --list /dump.bin | grep -c 'TABLE DATA' || true)"
SIZE="$(du -h "${OUT}" | cut -f1)"
if [[ "${ENTRIES}" -lt 1 ]]; then
    echo "Backup looks empty (no TABLE DATA entries): ${OUT}" >&2
    exit 1
fi
echo "Backup OK: ${OUT} (${SIZE}, ${ENTRIES} tables with data entries)"

# Retention: keep the newest KEEP_N dumps, delete the rest.
ls -1t "${BACKUP_DIR}"/vdp-*.dump 2>/dev/null | tail -n "+$((KEEP_N + 1))" | while read -r old; do
    rm -- "${old}"
    echo "Pruned old backup: ${old}"
done
