import { OptimiseApiResponseItem } from "@/services/dofus/optimiser";
import { Stack } from "../base/stack";
import { atom, PrimitiveAtom, useAtomValue } from "jotai";
import { Suspense, useMemo, useState } from "react";
import { getItemsInSlot } from "@/state/state";
import Fuse from "fuse.js";
import { ActionPin, ItemDisplay } from "../item";
import styled from "styled-components";

const ScrollStack = styled(Stack)`
  max-height: 400px;
  overflow-y: scroll;
`;

interface SearchResultsProps {
  query: string;
  item: (item: OptimiseApiResponseItem) => void;
  itemList: PrimitiveAtom<Promise<OptimiseApiResponseItem[]>>;
}

function SearchResults({ query, item, itemList }: SearchResultsProps) {
  const items = useAtomValue(itemList);

  const fuse = useMemo(() => new Fuse(items, { keys: ["name"] }), [items]);
  const search = useMemo(() => fuse.search(query), [fuse, query]);

  return (
    <ScrollStack>
      {search.map((x) => (
        <ItemDisplay
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
  const [query, setQuery] = useState("");

  console.log(query);

  return (
    <Stack>
      <label>
        Search:{" "}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <Suspense>
        <SearchResults query={query} item={item} itemList={items} />
      </Suspense>
    </Stack>
  );
}
