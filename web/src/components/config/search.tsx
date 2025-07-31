import { OptimiseApiResponseItem } from "@/services/dofus/optimiser";
import { Stack } from "@/components/base/stack";
import { atom, useAtom, useAtomValue } from "jotai";
import { Suspense, useMemo } from "react";
import { getItemsInSlot } from "@/state/state";
import { ActionPin, ItemDisplay } from "@/components/item";
import styled from "styled-components";
import { Atom } from "jotai";
import { allItemsAtom } from "@/state/allItemsState";
import { SearchResult, useSearch } from "@/services/search/search";
import { ClientOnly } from "../client";

const ScrollStack = styled(Stack)`
  max-height: 400px;
  overflow-y: scroll;
`;

interface SearchInputProps {
  item: (item: OptimiseApiResponseItem) => void;
  itemList: Atom<Promise<OptimiseApiResponseItem[]>>;
}

function SearchInput({ item, itemList }: SearchInputProps) {
  const queryAtom = useMemo(() => atom(""), []);

  const [query, setQuery] = useAtom(queryAtom);

  return (
    <Stack>
      <label>
        Search:{" "}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const query = e.target.value;
            setQuery(query);
          }}
        />
      </label>
      <Suspense fallback="Searching...">
        <Searcher queryAtom={queryAtom} itemList={itemList} item={item} />
      </Suspense>
    </Stack>
  );
}

interface SearcherProps {
  queryAtom: Atom<string>;
  itemList: Atom<Promise<OptimiseApiResponseItem[]>>;
  item: (item: OptimiseApiResponseItem) => void;
}

function Searcher({ itemList, queryAtom, item }: SearcherProps) {
  const search = useSearch(itemList, queryAtom);

  return (
    <Suspense>
      <SearchResults results={search} item={item} />
    </Suspense>
  );
}

interface SearchResultsProps {
  item: (item: OptimiseApiResponseItem) => void;

  results: SearchResult;
}

function SearchResults({ results, item }: SearchResultsProps) {
  const resultsValue = useAtomValue(results);
  return (
    <ScrollStack>
      {resultsValue.map((x) => (
        <ItemDisplay
          slot={-1}
          key={x.item.dofusId}
          item={x.item}
          actions={<ActionPin action={() => item(x.item)} />}
        />
      ))}
    </ScrollStack>
  );
}

interface SearchBoxProps {
  slot: number;
  item: (item: OptimiseApiResponseItem) => void;
}

export function SearchBox({ slot, item }: SearchBoxProps) {
  const items = useMemo(() => atom(getItemsInSlot(slot)), [slot]);

  return (
    <ClientOnly>
      <Suspense>
        <SearchInput item={item} itemList={items} />
      </Suspense>
    </ClientOnly>
  );
}

interface SearchAllItemsBoxProps {
  item: (item: OptimiseApiResponseItem) => void;
}

export function SearchAllItemsBox({ item }: SearchAllItemsBoxProps) {
  return (
    <ClientOnly>
      <Suspense>
        <SearchInput item={item} itemList={allItemsAtom} />
      </Suspense>
    </ClientOnly>
  );
}
