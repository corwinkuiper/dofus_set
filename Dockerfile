FROM docker.io/rust:alpine as builder

RUN apk add npm gcc libgcc musl-dev --no-cache

RUN USER=root cargo new dofus_optimiser
WORKDIR /dofus_optimiser
COPY Cargo.toml Cargo.toml
COPY Cargo.lock Cargo.lock

ENV RUSTFLAGS="-Ctarget-cpu=native"

RUN cargo build --release
RUN rm src -rf

COPY . .
RUN cargo build --release


FROM scratch
COPY --from=builder /dofus_optimiser/target/release/webserver .
COPY --from=builder /dofus_optimiser/web/build ./web/build
CMD ["./webserver"]