import {
  differentEquipmentWeightState,
  initialItemsState,
  useImmerAtom,
} from "@/state/state";
import { atom, useAtom, useAtomValue } from "jotai";
import { styled } from "styled-components";
import { ActionDelete, ActionPin, ActionSearch, ItemDisplay } from "../item";
import { Stack } from "../base/stack";
import { SearchBox } from "./search";
import { InputDecimal } from "../base/input";

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
        <>
          <ActionPin
            active={items[idx].pinned}
            action={() => {
              update((items) => {
                const item = items[idx];
                if (item) {
                  item.pinned = !item.pinned;
                }
              });
            }}
          />
          <ActionDelete
            action={() => {
              update((item) => {
                item[idx] = null;
              });
            }}
          />
        </>
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
          item[slotToSearchFor] = { pinned: false, item: set };
        });
      }}
      slot={slotToSearchFor}
    />
  );
}

export function InitialItems() {
  const items = useAtomValue(initialItemsState);
  const [changedItem, setChangedItem] = useAtom(differentEquipmentWeightState);

  return (
    <Stack $dir="h">
      <Search />
      <Stack $grow>
        <Stack $grow>
          <SetBox>
            {items.map((item, idx) => (
              <ItemDisplay
                item={item?.item}
                slot={idx}
                key={idx}
                actions={<ItemActions idx={idx} />}
              />
            ))}
          </SetBox>
        </Stack>
        <label>
          Changed item weight:{" "}
          <InputDecimal
            value={changedItem}
            onChange={(evt) => setChangedItem(evt)}
          />
        </label>
      </Stack>
    </Stack>
  );
}
