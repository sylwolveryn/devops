docker run --rm -it \
  -v "$(pwd)/.env:/home/pwuser/app/.env:ro" \
  -v "$(pwd)/example.spec.mjs:/home/pwuser/app/example.spec.mjs:ro" \
  -w /home/pwuser/app \
  sylwolveryn/playwright-pnpm-alpine:latest sh

# Then inside the container:
node example.spec.mjs