# devops
Devops sandbox


important things:

- pre-baked playwright docker image with
  - **pnpm** enabled
  - **alpine** based not ubuntu based
  - only **chromimum** as available, no firefox, or edge, etc...
  - **preinstalled npm packages**:
    - pnpm add \
      playwright \
      @playwright/test \
      typescript \
      playwright-ctrf-json-reporter \
      dotenv \
      jwt-decode \
      uuid
  - **+audit fix**
  - **home dir**: /home/pwuser/app
  - chromium is available under: '/usr/lib/chromium/chromium'
    - this must be set as **executablePath** inside **playwright config**
  - 

## build and push


### Log in to Docker Hub
docker login

### Start the builder
```shell
docker buildx rm pbuilder
```

```shell
docker buildx create --name pbuilder --use
```

```shell
docker buildx inspect --bootstrap
```

### Build for both architectures and push in one command ALPINE
```shell
docker buildx build -f playwright-pnpm-alpine.dockerfile --platform linux/amd64,linux/arm64 -t sylwolveryn/playwright-pnpm-alpine:latest  -t sylwolveryn/playwright-pnpm-alpine:1.0.4 --push .
```

### Build for both architectures and push in one command NOBLE // DEPRECATED, NO MORE UBUNTU
```shell
docker buildx build -f playwright-pnpm-noble.dockerfile --platform linux/amd64,linux/arm64 -t sylwolveryn/playwright-pnpm-noble:latest --push .
```

## cleanup old builders

### List all builders
```shell
docker buildx ls
```

### Remove specific builders
```shell
docker buildx rm pbuilder
```

### Or remove all but the default and start fresh
```shell
docker buildx rm pbuilder pbuilderv2 pbuilderv3
```

```shell
docker buildx create --name mybuilder --use
```

## Cleanup

### See disk usage breakdown
```shell
docker system df
```

### See detailed build cache
```shell
docker buildx du
```

### List all images
```shell
docker images
```

### Remove everything unused - stopped containers, netdocker system prune -a -f
```shell
docker buildx prune -a -f
```

### Specifically clean buildx cache (often takes the most space)
```shell
docker buildx prune -a -f
```

## AUDIT

### VEX
vex.json

# Pull, attach VEX, push back
docker pull sylwolveryn/playwright-pnpm-alpine:latest
docker scout attestation add --file vex.json --predicate-type https://openvex.dev/ns/v0.2.0 sylwolveryn/playwright-pnpm-alpine:latest
docker push sylwolveryn/playwright-pnpm-alpine:latest