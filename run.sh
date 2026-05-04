#!/bin/bash

mkdir -p ./output

echo "📦 Pulling latest image..."
docker pull sylwolveryn/playwright-pnpm-alpine:latest

echo "🚀 Running Playwright automation..."
docker run --rm \
  -v "$(pwd)/.env:/home/pwuser/app/.env:ro" \
  -v "$(pwd)/example.spec.mjs:/home/pwuser/app/example.spec.mjs:ro" \
  -v "$(pwd)/output:/tmp/playwright-output" \
  -w /home/pwuser/app \
  sylwolveryn/playwright-pnpm-alpine:latest \
  node example.spec.mjs

echo "✅ Done! Check the './output' directory:"
ls -la ./output/