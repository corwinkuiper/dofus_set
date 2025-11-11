import Fuse, { type IFuseOptions } from "fuse.js";

interface SearchCommandConfigure {
  kind: "configure";
  items: unknown[];
  config: IFuseOptions<unknown>;
}

interface Search {
  kind: "search";
  query: string;
}

interface JobId {
  id: string;
}

export type SearchCommand = JobId & (SearchCommandConfigure | Search);

let searchFuse: Fuse<unknown> | null = null;

onmessage = (message: MessageEvent<SearchCommand>) => {
  if (message.data.kind === "configure") {
    const { items, config } = message.data;
    searchFuse = new Fuse(items, config);
  } else if (message.data.kind === "search") {
    const results = (searchFuse && searchFuse.search(message.data.query)) || [];
    postMessage({
      id: message.data.id,
      response: results,
      success: true,
    });
  }
};
