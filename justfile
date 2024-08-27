wasm-demo:
    (cd wasm; rustup run nightly wasm-pack build --release --target web; wasm-opt -O4 -o pkg/wasm_bg.wasm pkg/wasm_bg.wasm; python -m http.server)
serve:
    (cd web; npm run build); cargo run --release --bin=server

prepare-web:
    (cd wasm;  rustup run nightly wasm-pack  build --release --target web)
    rm -rf web/src/dofus/pkg
    cp -r wasm/pkg web/src/dofus/pkg

web: prepare-web
    (cd web; npm install --no-save --prefer-offline --no-audit; npm run start)