#!/bin/sh
LENGTH="${1:-32}"
BYTES=$(( (LENGTH * 3 + 3) / 4 ))
openssl rand -base64 "$BYTES" | tr -d '\n' | tr '+/' '-_' | head -c "$LENGTH"
echo
