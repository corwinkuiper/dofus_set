import { generateId } from "$lib/util/generate-id";
import type { DofusItem } from "./types";
import type { SearchCommand } from "./search-worker";
import type { FuseResult } from "fuse.js";
import { optimiser } from "./optimiser-service";
import type { Language } from "$lib/state/lang.svelte";

interface QueuedJob {
  query: SearchCommand;
  resolve: (data: unknown) => void;
  reject: (data: unknown) => void;
  abort: AbortSignal;
}

class Search {
  private items: DofusItem[];
  private language: string;

  private activeJobs: {
    [id: string]: {
      resolve: (data: unknown) => void;
      reject: (data: unknown) => void;
    };
  } = {};
  private jobQueue: QueuedJob[] = [];
  private freeWorkers: Worker[] = [];
  private desiredWorkerCount: number;

  private workers: Set<Worker> = new Set();

  constructor(items: DofusItem[], language: Language) {
    this.items = items;
    this.language = language;
    this.desiredWorkerCount = navigator.hardwareConcurrency || 1;
  }

  terminate() {
    this.desiredWorkerCount = 0;
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = new Set();
  }

  private workerCount() {
    return this.workers.size;
  }

  private createWorker() {
    console.log("Creating search worker");
    const worker = new Worker(new URL("./search-worker", import.meta.url), {
      type: "module",
    });
    this.workers.add(worker);
    worker.onmessage = (message) => {
      const id = message.data.id;
      console.log("Search job message", message.data);
      if (message.data.success) {
        this.activeJobs[id].resolve(message.data.response);
      } else {
        this.activeJobs[id].reject(message.data.response);
      }
      delete this.activeJobs[id];

      if (this.workerCount() > this.desiredWorkerCount) {
        this.terminateWorker(worker);
      } else {
        this.freeWorkers.push(worker);
        this.allocateJob();
      }
    };
    worker.onerror = () => {
      this.terminateWorker(worker);
      this.createWorker();
      this.freeWorkers = this.freeWorkers.filter((x) => x !== worker);
    };

    worker.postMessage({
      id: generateId(),
      kind: "configure",
      items: this.items,
      config: { keys: [`name.${this.language}`] },
    });

    this.freeWorkers.push(worker);
  }

  private terminateWorker(worker: Worker) {
    worker.terminate();
    this.workers.delete(worker);
  }

  private balanceWorkers() {
    if (this.workerCount() < this.desiredWorkerCount) this.createWorker();
  }

  private allocateJob() {
    this.balanceWorkers();
    if (this.jobQueue.length > 0 && this.freeWorkers.length > 0) {
      const job = this.jobQueue.pop()!; // just checked it is not empty
      if (job.abort.aborted) {
        // retry
        this.allocateJob();
        return;
      }
      const worker = this.freeWorkers.pop()!; // just checked it is not empty
      const abortListener = () => {
        this.terminateWorker(worker);
        this.createWorker();
        job.reject({ message: "aborted" });
      };

      job.abort.addEventListener("abort", abortListener);

      const wrapRemoveListener = (f: (data: unknown) => void) => {
        return (data: unknown) => {
          job.abort.removeEventListener("abort", abortListener);
          f(data);
        };
      };

      this.activeJobs[job.query.id] = {
        resolve: wrapRemoveListener(job.resolve),
        reject: wrapRemoveListener(job.reject),
      };
      worker.postMessage(job.query);
    }
  }

  private queueJob(
    query: SearchCommand,
    resolve: (data: unknown) => void,
    reject: (data: unknown) => void,
    abort: AbortSignal
  ) {
    console.log("Job allocated", query);
    this.jobQueue.push({ query, resolve, reject, abort });
    this.allocateJob();
  }

  freeWorkerCount() {
    return this.freeWorkers.length;
  }

  queuedJobCount() {
    return this.jobQueue.length;
  }

  async search(
    query: string,
    extra?: { abort?: AbortSignal }
  ): Promise<FuseResult<DofusItem>[]> {
    return new Promise((resolve, reject) => {
      const jobId = generateId();

      this.queueJob(
        {
          id: jobId,
          kind: "search",
          query,
        },
        (data: unknown) => resolve(data as FuseResult<DofusItem>[]),
        reject,
        extra?.abort ?? new AbortController().signal
      );
    });
  }
}

export async function makeSearcherForSlot(slot: number, language: Language) {
  const items = await optimiser.get_items_in_slot(slot);
  return new Search(items, language);
}

export async function makeSearcherForAllItems(language: Language) {
  const items = await optimiser.get_all_items();
  return new Search(items, language);
}
