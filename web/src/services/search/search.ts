import { atom, Atom, useAtomValue, useSetAtom } from "jotai";
import { OptimiseApiResponseItem } from "../dofus/optimiser";
import { SearchCommand } from "./searchWorker";
import { languageAtom } from "@/state/languageState";
import { useEffect, useMemo } from "react";
import { FuseResult } from "fuse.js";
import { generateId } from "../generateId";

interface QueuedJob {
  query: SearchCommand;
  resolve: (data: unknown) => void;
  reject: (data: unknown) => void;
  abort: AbortSignal;
}

class Search {
  private items: OptimiseApiResponseItem[];
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

  constructor(items: OptimiseApiResponseItem[], language: string) {
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
    const worker = new Worker(new URL("./searchWorker", import.meta.url));
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
  ): Promise<FuseResult<OptimiseApiResponseItem>[]> {
    return new Promise((resolve, reject) => {
      const jobId = generateId();

      this.queueJob(
        {
          id: jobId,
          kind: "search",
          query,
        },
        (data: unknown) =>
          resolve(data as FuseResult<OptimiseApiResponseItem>[]),
        reject,
        extra?.abort ?? new AbortController().signal
      );
    });
  }
}

export type SearchResult = Atom<Promise<FuseResult<OptimiseApiResponseItem>[]>>;

export function useSearch(
  itemsAtom: Atom<Promise<OptimiseApiResponseItem[]>>,
  queryAtom: Atom<string>
): SearchResult {
  const searchAtom = useMemo(() => atom<Search | null>(null), []);
  const items = useAtomValue(itemsAtom);
  const language = useAtomValue(languageAtom);

  const setSearchAtom = useSetAtom(searchAtom);

  useEffect(() => {
    const worker = new Search(items, language);
    setSearchAtom(worker);

    return () => {
      worker.terminate();
    };
  });

  const resultAtom = useMemo(() => {
    return atom(
      async (get, { signal }) =>
        await (get(searchAtom)?.search(get(queryAtom), { abort: signal }) ??
          Promise.resolve([]))
    );
  }, [queryAtom, searchAtom]);

  return resultAtom;
}
