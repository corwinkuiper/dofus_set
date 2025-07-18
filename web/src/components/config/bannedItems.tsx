import { Stack } from "../base/stack";
import { SearchAllItemsBox } from "./search";
import { useImmerAtom } from "@/state/state";
import { bannedItemsAtom } from "@/state/bannedItemsState";
import { styled } from "styled-components";
import { ActionDelete, ItemDisplay } from "../item";
import { enableMapSet } from "immer";
import { useClientAtom } from "@/hooks/useClientAtom";

enableMapSet();

const SetBox = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(192px, auto));
  max-width: 100%;
  max-height: 400px;
  overflow-y: scroll;
`;

export function BannedItems() {
  const atom = useClientAtom(bannedItemsAtom, new Map());
  const [items, updateItems] = useImmerAtom(atom);

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
                slot={-1}
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
