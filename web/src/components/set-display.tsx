import {
  OptimiseApiResponseItem,
  OptimiseApiResponseSetBonus,
} from "@/services/dofus/optimiser";
import styled from "styled-components";
import { EmptyItemDisplay, ItemDisplay, SetBonusDisplay } from "./item";

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
}

function SingleItemOrNullDisplay({ item }: SingleItemOrNullDisplayProps) {
  if (item) {
    return <ItemDisplay item={item} />;
  } else {
    return <EmptyItemDisplay />;
  }
}

export function SetDisplay({ set }: SetDisplayProps) {
  return (
    <SetBox>
      {set.map((item, idx) => (
        <SingleItemOrNullDisplay item={item} key={idx} />
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
