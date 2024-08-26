wasm-demo:
    (cd wasm; rustup run nightly wasm-pack  build --release --target web; python -m http.server)