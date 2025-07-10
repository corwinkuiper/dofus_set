import init, {
  setup,
  query,
  items_in_slot,
  get_spells,
  get_all_items,
} from "@/pkg/wasm";
import { OptimisationConfig } from "./optimiser";

interface WorkerQueryId {
  id: string;
}

interface WorkerQueryOptimise {
  kind: "optimise";
  request: OptimisationConfig;
}

interface WorkerQueryGetSlot {
  kind: "get-slot";
  slot: number;
}

interface WorkerSpellsGet {
  kind: "get-spells";
}

interface WorkerGetAllItems {
  kind: "get-items";
}

export type WorkerQuery = WorkerQueryId &
  (
    | WorkerQueryGetSlot
    | WorkerQueryOptimise
    | WorkerSpellsGet
    | WorkerGetAllItems
  );

const initialised = (async () => {
  await init({});
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
  } else if (message.data.kind === "get-spells") {
    try {
      const response = get_spells();
      postMessage({ id: message.data.id, success: true, response });
    } catch (e) {
      postMessage({ id: message.data.id, success: false, response: e });
    }
  } else if (message.data.kind === "get-items") {
    try {
      const response = get_all_items();
      postMessage({ id: message.data.id, success: true, response });
    } catch (e) {
      postMessage({ id: message.data.id, success: false, response: e });
    }
  }
};
