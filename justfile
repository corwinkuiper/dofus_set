wasm-demo:
    (cd wasm; wasm-pack build --release --target web; python -m http.server)