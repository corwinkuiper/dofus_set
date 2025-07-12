import { OptimiseApiResponseItem } from "@/services/dofus/optimiser";
import { Stack } from "../base/stack";
import { atom, useAtomValue } from "jotai";
import { Suspense, useMemo, useState, useTransition } from "react";
import { getAllItems, getItemsInSlot } from "@/state/state";
import Fuse, { FuseResult } from "fuse.js";
import { ActionPin, ItemDisplay } from "../item";
import styled from "styled-components";
import { Atom } from "jotai";

const ScrollStack = styled(Stack)`
  max-height: 400px;
  overflow-y: scroll;
`;

interface SearchResultsProps {
  item: (item: OptimiseApiResponseItem) => void;
  itemList: Atom<Promise<OptimiseApiResponseItem[]>>;
}

function SearchResults({ item, itemList }: SearchResultsProps) {
  const items = useAtomValue(itemList);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FuseResult<OptimiseApiResponseItem>[]>(
    []
  );

  const [, startTransition] = useTransition();

  const fuse = useMemo(() => new Fuse(items, { keys: ["name"] }), [items]);

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
            startTransition(() => {
              const results = fuse.search(query);
              setResults(results);
            });
          }}
        />
      </label>
      <ScrollStack>
        {results.map((x) => (
          <ItemDisplay
            key={x.item.dofusId}
            item={x.item}
            actions={<ActionPin action={() => item(x.item)} />}
          />
        ))}
      </ScrollStack>
    </Stack>
  );
}

interface SearchBoxProps {
  slot: number;
  item: (item: OptimiseApiResponseItem) => void;
}

export function SearchBox({ slot, item }: SearchBoxProps) {
  const items = useMemo(() => atom(getItemsInSlot(slot)), [slot]);

  return (
    <Suspense>
      <SearchResults item={item} itemList={items} />
    </Suspense>
  );
}

interface SearchAllItemsBoxProps {
  item: (item: OptimiseApiResponseItem) => void;
}

export const allItemsAtom = atom(() => getAllItems());

export function SearchAllItemsBox({ item }: SearchAllItemsBoxProps) {
  return (
    <Suspense>
      <SearchResults item={item} itemList={allItemsAtom} />
    </Suspense>
  );
}
