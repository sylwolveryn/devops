# Run an interactive shell to inspect the image
docker run --rm -it --user pwuser sylwolveryn/playwright-pnpm-alpine:latest sh


# Inside the container, check:
echo $PNPM_HOME
echo $PATH
ls -la $PNPM_HOME
pnpm list -g
node -e "console.log(require.resolve('playwright'))"