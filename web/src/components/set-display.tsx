import {
  OptimiseApiResponseItem,
  OptimiseApiResponseSetBonus,
} from "@/services/dofus/optimiser";
import styled from "styled-components";
import { ActionDelete, ActionPin, ItemDisplay, SetBonusDisplay } from "./item";
import { initialItemsState, useImmerAtom } from "@/state/state";
import { bannedItemsAtom } from "@/state/bannedItemsState";

interface SetDisplayProps {
  set: (OptimiseApiResponseItem | null)[];
}

const SetBox = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(192px, 300px));
  max-width: 100%;
`;

interface SingleItemOrNullDisplayProps {
  item: OptimiseApiResponseItem | null;
  idx: number;
}

function SingleItemOrNullDisplay({ item, idx }: SingleItemOrNullDisplayProps) {
  const [initialItems, updateInitialItems] = useImmerAtom(initialItemsState);
  const [bannedItems, updateBannedItems] = useImmerAtom(bannedItemsAtom);

  return (
    <ItemDisplay
      item={item ?? undefined}
      slot={idx}
      actions={
        !!item && (
          <>
            <ActionPin
              action={() =>
                updateInitialItems((items) => {
                  items[idx] = { pinned: false, item: item };
                })
              }
              active={
                initialItems.find((x) => x.item?.dofusId === item.dofusId)
                  ?.pinned
              }
            />
            <ActionDelete
              action={() =>
                updateBannedItems((items) => {
                  items.set(item.dofusId, item);
                })
              }
              active={bannedItems.has(item.dofusId)}
            />
          </>
        )
      }
    />
  );
}

export function SetDisplay({ set }: SetDisplayProps) {
  return (
    <SetBox>
      {set.map((item, idx) => (
        <SingleItemOrNullDisplay item={item} key={idx} idx={idx} />
      ))}
    </SetBox>
  );
}

interface SetBonusesDisplayProps {
  bonuses: OptimiseApiResponseSetBonus[];
}

export function SetBonusesDisplay({ bonuses }: SetBonusesDisplayProps) {
  return (
    <SetBox>
      {bonuses.map((x) => (
        <SetBonusDisplay key={x.name} set={x} />
      ))}
    </SetBox>
  );
}
