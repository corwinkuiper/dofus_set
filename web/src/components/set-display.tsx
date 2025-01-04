import { OptimiseApiResponseItem } from "@/services/dofus/optimiser";
import styled from "styled-components";
import { EmptyItemDisplay, ItemDisplay } from "./item";

interface SetDisplayProps {
  set: (OptimiseApiResponseItem | null)[];
}

const SetBox = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(192px, auto));
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
