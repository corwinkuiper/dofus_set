wasm-demo:
    (cd wasm; rustup run nightly wasm-pack build --release --target web; wasm-opt -O4 -o pkg/wasm_bg.wasm pkg/wasm_bg.wasm; python -m http.server)
serve:
    (cd web; npm run build); cargo run --release --bin=server