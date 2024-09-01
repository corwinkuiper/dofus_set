wasm-demo:
    (cd wasm; rustup run nightly wasm-pack  build --release --target web; python -m http.server)
serve:
    (cd web; npm run build); cargo run --release --bin=server