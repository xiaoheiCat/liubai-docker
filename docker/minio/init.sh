#!/bin/sh
set -eu

ALIAS="liubai"
ENDPOINT="http://minio:9000"
BUCKET="${MINIO_BUCKET:-liubai}"
MAX_TRIES=30

echo "minio-init: waiting for MinIO at ${ENDPOINT}..."

i=1
while [ "$i" -le "$MAX_TRIES" ]; do
  if mc alias set "$ALIAS" "$ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1 \
    && mc ready "$ALIAS" >/dev/null 2>&1; then
    break
  fi
  echo "minio-init: attempt ${i}/${MAX_TRIES}..."
  sleep 2
  i=$((i + 1))
done

if ! mc ready "$ALIAS" >/dev/null 2>&1; then
  echo "minio-init: MinIO is not ready" >&2
  exit 1
fi

echo "minio-init: creating bucket ${BUCKET}..."
mc mb "${ALIAS}/${BUCKET}" --ignore-existing

echo "minio-init: setting public read policy..."
mc anonymous set download "${ALIAS}/${BUCKET}"

echo "minio-init: done (global CORS is configured via MINIO_API_CORS_ALLOW_ORIGIN on the minio service)"
