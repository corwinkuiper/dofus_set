FROM rust:alpine as builder

RUN apk add npm gcc libgcc musl-dev --no-cache

RUN USER=root cargo new dofus_optimiser
WORKDIR /dofus_optimiser
COPY Cargo.toml Cargo.toml
COPY Cargo.lock Cargo.lock

RUN cargo build --release
RUN rm src -rf

COPY . .
RUN cargo build --release


FROM alpine
RUN apk add dumb-init --no-cache
COPY --from=builder /dofus_optimiser/target/release/webserver .
ENTRYPOINT ["dumb-init"]
CMD ["./webserver"]