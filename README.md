# devops
Devops sandbox


# build and push


# Log in to Docker Hub
docker login

# (Optional but recommended) Create and use a new builder that can handle multiple platforms
# Start the builder
docker buildx create --name pbuilder --use
docker buildx inspect --bootstrap

# Build for both architectures and push in one command ALPINE
docker buildx build -f playwright-pnpm-alpine.dockerfile --platform linux/amd64,linux/arm64 -t sylwolveryn/playwright-pnpm-alpine:latest  -t sylwolveryn/playwright-pnpm-alpine:1.0.0 --push .
docker buildx build -f playwright-pnpm-alpine.dockerfile --platform linux/amd64,linux/arm64 -t sylwolveryn/playwright-pnpm-alpine:latest --push .


# Build for both architectures and push in one command NOBLE
docker buildx build -f playwright-pnpm-noble.dockerfile --platform linux/amd64,linux/arm64 -t sylwolveryn/playwright-pnpm-noble:latest --push .

## cleanup old builders

### List all builders
docker buildx ls

### Remove specific builders
docker buildx rm pbuilder

### Or remove all but the default and start fresh
docker buildx rm pbuilder pbuilderv2 pbuilderv3
docker buildx create --name mybuilder --use

# Cleanup

## See disk usage breakdown
docker system df

# See detailed build cache
docker buildx du

# List all images
docker images

# List all builders
docker buildx ls

# Remove everything unused - stopped containers, netdocker system prune -a -f
docker buildx prune -a -f

# Specifically clean buildx cache (often takes the most space)
docker buildx prune -a -f

# Remove old builders
docker buildx rm pbuilder pbuilderv2 2>/dev/null
docker buildx rm $(docker buildx ls -q | grep -v default | grep -v playwright-builder) 2>/dev/null


## AUDIT

### VEX
vex.json

# Pull, attach VEX, push back
docker pull sylwolveryn/playwright-pnpm-alpine:latest
docker scout attestation add --file vex.json --predicate-type https://openvex.dev/ns/v0.2.0 sylwolveryn/playwright-pnpm-alpine:latest
docker push sylwolveryn/playwright-pnpm-alpine:latest