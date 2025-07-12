prepare-web:
    (cd wasm; wasm-pack build --release --target web)
    rm -rf web/src/pkg
    cp -r wasm/pkg web/src/pkg

web: prepare-web
    (cd web; npm install --no-save --prefer-offline --no-audit; npm run dev)
