import { OptimiseApiResponseItem } from "@/services/dofus/optimiser";
import { atom, SetStateAction } from "jotai";
import { Stack } from "../base/stack";
import { allItemsAtom, SearchAllItemsBox } from "./search";
import { useImmerAtom } from "@/state/state";
import { styled } from "styled-components";
import { ActionDelete, ItemDisplay } from "../item";
import { enableMapSet } from "immer";

enableMapSet();

const bannedItemsInnerAtom = atom<Map<
  number,
  OptimiseApiResponseItem
> | null>();

export const bannedItemsAtom = atom(
  async (get) => {
    const atom = get(bannedItemsInnerAtom);
    if (!atom) {
      const allItems = await get(allItemsAtom);
      const map = new Map(
        allItems
          .filter((x) => x.name.startsWith("Khardboard"))
          .map((x) => [x.dofusId, x])
      );
      return map;
    } else {
      return atom;
    }
  },
  async (
    get,
    set,
    newValue: SetStateAction<Map<number, OptimiseApiResponseItem>>
  ) => {
    if (typeof newValue === "function") {
      const defaultBanned = await get(bannedItemsAtom);
      set(bannedItemsInnerAtom, (value) => newValue(value ?? defaultBanned));
    } else {
      set(bannedItemsInnerAtom, newValue);
    }
  }
);

const SetBox = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(192px, auto));
  max-width: 100%;
  max-height: 400px;
  overflow-y: scroll;
`;

export function BannedItems() {
  const [items, updateItems] = useImmerAtom(bannedItemsAtom);

  return (
    <Stack $dir="h">
      <SearchAllItemsBox
        item={(item) => {
          updateItems((items) => {
            if (items.has(item.dofusId)) {
              items.delete(item.dofusId);
            } else {
              items.set(item.dofusId, item);
            }
          });
        }}
      />
      <Stack $grow>
        <SetBox>
          {[
            ...items.entries().map(([, x]) => (
              <ItemDisplay
                key={x.dofusId}
                item={x}
                actions={
                  <ActionDelete
                    action={() =>
                      updateItems((items) => {
                        items.delete(x.dofusId);
                      })
                    }
                  />
                }
              />
            )),
          ]}
        </SetBox>
      </Stack>
    </Stack>
  );
}
