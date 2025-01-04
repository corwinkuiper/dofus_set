"use client";

import { WorkerQuery } from "./worker";

export interface OptimiseApiResponse {
  energy: number;
  overallCharacteristics: number[];
  items: (OptimiseApiResponseItem | null)[];
  setBonuses: OptimiseApiResponseSetBonus[];
}

export interface OptimiseApiResponseItem {
  characteristics: number[];
  name: string;
  itemType: string;
  level: number;
  imageUrl: string;
  dofusId: number;
}

export interface OptimiseApiResponseSetBonus {
  name: string;
  numberOfItems: number;
  characteristics: number[];
}

export interface OptimiseRequest {
  weights: number[];
  maxLevel: number;
  initialItems: (number | undefined)[];
  fixedItems: number[];
  bannedItems: number[];
  apExo: boolean;
  mpExo: boolean;
  rangeExo: boolean;
  multiElement: boolean;
  iterations: number;
}

export interface SearchApiResponseItem {
  characteristics: number[];
  name: string;
  itemType: string;
  level: number;
  imageUrl?: string;
  dofusId: number;
}

interface QueuedJob {
  query: WorkerQuery;
  resolve: (data: unknown) => void;
  reject: (data: unknown) => void;
  abort: AbortSignal;
}

export class Optimiser {
  private activeJobs: {
    [id: string]: {
      resolve: (data: unknown) => void;
      reject: (data: unknown) => void;
    };
  } = {};
  private jobQueue: QueuedJob[] = [];
  private freeWorkers: Worker[] = [];

  constructor() {
    const threads = navigator.hardwareConcurrency;
    while (this.freeWorkerCount() < threads) this.createWorker();
  }

  private createWorker() {
    console.log("Creating worker");
    const worker = new Worker(new URL("./worker", import.meta.url));
    worker.onmessage = (message) => {
      const id = message.data.id;
      console.log("Job resolved", id, message.data.response);
      if (message.data.success) {
        this.activeJobs[id].resolve(message.data.response);
      } else {
        this.activeJobs[id].reject(message.data.response);
      }
      delete this.activeJobs[id];

      this.freeWorkers.push(worker);
      this.allocateJob();
    };
    worker.onerror = () => {
      worker.terminate();
      console.log("Worker failed");
      this.createWorker();
      this.freeWorkers = this.freeWorkers.filter((x) => x !== worker);
    };

    this.freeWorkers.push(worker);
  }

  private allocateJob() {
    console.log(this);
    if (this.jobQueue.length > 0 && this.freeWorkers.length > 0) {
      const job = this.jobQueue.pop()!; // just checked it is not empty
      if (job.abort.aborted) {
        // retry
        this.allocateJob();
        return;
      }
      const worker = this.freeWorkers.pop()!; // just checked it is not empty
      const abortListener = () => {
        worker.terminate();
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
      console.log("Job sent to worker");
      worker.postMessage(job.query);
    }
  }

  private queueJob(
    query: WorkerQuery,
    resolve: (data: unknown) => void,
    reject: (data: unknown) => void,
    abort: AbortSignal
  ) {
    console.log("Job added to queue");
    this.jobQueue.push({ query, resolve, reject, abort });
    this.allocateJob();
  }

  freeWorkerCount() {
    return this.freeWorkers.length;
  }

  queuedJobCount() {
    return this.jobQueue.length;
  }

  async optimise(
    options: OptimiseRequest,
    extra?: { abort?: AbortSignal }
  ): Promise<OptimiseApiResponse> {
    return new Promise((resolve, reject) => {
      ``;
      const jobId = crypto.randomUUID();

      this.queueJob(
        {
          id: jobId,
          kind: "optimise",
          request: options,
        },
        (data: unknown) => resolve(data as OptimiseApiResponse),
        reject,
        extra?.abort ?? new AbortController().signal
      );
    });
  }

  async get_items_in_slot(slot: number): Promise<SearchApiResponseItem[]> {
    return new Promise((resolve, reject) => {
      const jobId = crypto.randomUUID();
      this.queueJob(
        {
          id: jobId,
          kind: "get-slot",
          slot,
        },
        (data) => resolve(data as SearchApiResponseItem[]),
        reject,
        new AbortController().signal
      );
    });
  }
}
