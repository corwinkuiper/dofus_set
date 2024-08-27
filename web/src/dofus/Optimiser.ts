import { OptimiseRequest, OptimiseApiResponse } from "./OptimiseApi";
import { SearchApiResponseItem } from "./SearchApi";
import { WorkerQuery } from "./Worker";

export class Optimiser {
  private activeJobs: {
    [id: string]: { resolve: (data: any) => void; reject: (data: any) => void };
  } = {};
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL("./Worker", import.meta.url));
    this.worker.onmessage = (message) => {
      const id = message.data.id;
      console.log("Job resolved", id, message.data.response);
      if (message.data.success) {
        this.activeJobs[id].resolve(message.data.response);
      } else {
        this.activeJobs[id].reject(message.data.response);
      }
      delete this.activeJobs[id];
    };
  }

  private sendJob(query: WorkerQuery) {
    this.worker.postMessage(query);
  }

  async optimise(options: OptimiseRequest): Promise<OptimiseApiResponse> {
    return new Promise((resolve, reject) => {
      const jobId = crypto.randomUUID();
      this.activeJobs[jobId] = { resolve, reject };
      console.log("Job started", jobId);
      this.sendJob({
        id: jobId,
        kind: "optimise",
        request: {
          weights: options.weights,
          max_level: options.maxLevel,
          fixed_items: options.fixedItems,
          banned_items: options.bannedItems,
          exo_ap: options.apExo,
          exo_mp: options.mpExo,
          exo_range: options.rangeExo,
          multi_element: options.multiElement,
          iterations: options.iterations,
        },
      });
    });
  }

  async get_items_in_slot(slot: number): Promise<SearchApiResponseItem[]> {
    return new Promise((resolve, reject) => {
      const jobId = crypto.randomUUID();
      this.activeJobs[jobId] = { resolve, reject };

      console.log("Job started", jobId);

      this.sendJob({
        id: jobId,
        kind: "get-slot",
        slot,
      });
    });
  }
}
