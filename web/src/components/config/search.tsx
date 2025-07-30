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
  const search = useSearch(itemList, queryAtom);

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
        <SearchResults results={search} item={item} />
      </Suspense>
    </Stack>
  );
}

interface SearchResults2Props {
  item: (item: OptimiseApiResponseItem) => void;

  results: SearchResult;
}

function SearchResults({ results, item }: SearchResults2Props) {
  const results2 = useAtomValue(results);
  return (
    <ScrollStack>
      {results2.map((x) => (
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
