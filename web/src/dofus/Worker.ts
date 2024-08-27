import init, { setup, query, items_in_slot } from "./pkg/wasm";

const initialised = (async () => {
  await init();
  setup();
})();

onmessage = async (message) => {
  await initialised;

  if (message.data.kind === "optimise") {
    try {
      const response = query(message.data.request);
      postMessage({ id: message.data.id, success: true, response });
    } catch (e) {
      postMessage({ id: message.data.id, success: false, response: e });
    }
  } else if (message.data.kind === "get-slot") {
    try {
      const response = items_in_slot(message.data.slot);
      postMessage({ id: message.data.id, success: true, response });
    } catch (e) {
      postMessage({ id: message.data.id, success: false, response: e });
    }
  }
};
