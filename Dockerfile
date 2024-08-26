FROM docker.io/rust:alpine as builder_be

RUN apk add gcc libgcc musl-dev --no-cache

ENV RUSTFLAGS="-Ctarget-cpu=native"

WORKDIR /dofus_optimiser
COPY . .

RUN --mount=type=cache,target=/dofus_optimiser/target \
    cargo build --release --bin=server && cp target/release/server webserver

FROM docker.io/node:alpine as builder_web
WORKDIR /dofus_optimiser/web

COPY web .
RUN --mount=type=cache,target=/dofus_optimiser/web/node_modules \
    npm install --no-save --prefer-offline --no-audit && npm run build

FROM scratch
COPY --from=builder_be /dofus_optimiser/webserver .
COPY --from=builder_web /dofus_optimiser/web/build ./web/build
CMD ["./webserver"]