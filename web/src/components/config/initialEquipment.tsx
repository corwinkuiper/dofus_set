import { initialItemsState, useImmerAtom } from "@/state/state";
import { atom, useAtom, useAtomValue } from "jotai";
import { styled } from "styled-components";
import { ActionDelete, ActionSearch, ItemDisplay } from "../item";
import { Stack } from "../base/stack";
import { SearchBox } from "./search";

const SetBox = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(192px, auto));
  max-width: 100%;
`;

const searchState = atom<null | number>(null);

function ItemActions({ idx }: { idx: number }) {
  const [items, update] = useImmerAtom(initialItemsState);
  const [slotToSearchFor, setSearch] = useAtom(searchState);

  return (
    <>
      {items[idx] && (
        <ActionDelete
          action={() => {
            update((item) => {
              item[idx] = undefined;
            });
          }}
        />
      )}
      <ActionSearch
        active={slotToSearchFor === idx}
        action={() => {
          const set = slotToSearchFor !== idx ? idx : null;
          setSearch(set);
        }}
      />
    </>
  );
}

function Search() {
  const slotToSearchFor = useAtomValue(searchState);
  const [, update] = useImmerAtom(initialItemsState);

  if (slotToSearchFor === null) return;

  return (
    <SearchBox
      item={(set) => {
        update((item) => {
          item[slotToSearchFor] = set;
        });
      }}
      slot={slotToSearchFor}
    />
  );
}

export function InitialItems() {
  const items = useAtomValue(initialItemsState);

  return (
    <Stack $dir="h">
      <Search />
      <Stack $grow>
        <SetBox>
          {items.map((item, idx) => (
            <ItemDisplay
              item={item}
              key={idx}
              actions={<ItemActions idx={idx} />}
            />
          ))}
        </SetBox>
      </Stack>
    </Stack>
  );
}
