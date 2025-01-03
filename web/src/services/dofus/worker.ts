import init, { setup, query, items_in_slot } from "@/pkg/wasm";

interface WorkerQueryId {
  id: string;
}

interface OptimiseApiRequest {
  weights: number[];
  max_level: number;
  fixed_items: (number | undefined)[];
  banned_items: number[];
  exo_ap: boolean;
  exo_mp: boolean;
  exo_range: boolean;
  multi_element: boolean;
  iterations: number;
}

interface WorkerQueryOptimise {
  kind: "optimise";
  request: OptimiseApiRequest;
}

interface WorkerQueryGetSlot {
  kind: "get-slot";
  slot: number;
}

export type WorkerQuery = WorkerQueryId &
  (WorkerQueryGetSlot | WorkerQueryOptimise);

const initialised = (async () => {
  await init();
  setup();
})();

onmessage = async (message: MessageEvent<WorkerQuery>) => {
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
