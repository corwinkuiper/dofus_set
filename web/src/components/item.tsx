"use client";

import { Item } from "@/services/dofus/item";
import Image from "next/image";
import { createContext, ReactNode, useContext } from "react";
import styled from "styled-components";
import pin from "@/assets/pin.svg";
import search from "@/assets/search.svg";
import bin from "@/assets/bin.svg";

const ItemActions = styled.div``;
const ItemName = styled.span``;
const ItemImage = styled(Image)``;

const ItemBox = styled.div`
  display: flex;
`;

const ActionImage = styled(Image)``;

interface ItemProps {
  item: Item;
  actions?: ReactNode;
}

interface ActionProps {
  action: (item: Item) => void;
}

const ItemContext = createContext<Item | null>(null);
function useItem(): Item {
  const item = useContext(ItemContext);
  if (!item) throw Error("Action should be used in item display");

  return item;
}

export function ActionPin({ action }: ActionProps) {
  const item = useItem();
  return <ActionImage src={pin} alt="Pin item" onClick={() => action(item)} />;
}

export function ActionSearch({ action }: ActionProps) {
  const item = useItem();
  return <ActionImage src={search} alt="Search" onClick={() => action(item)} />;
}

export function ActionDelete({ action }: ActionProps) {
  const item = useItem();
  return (
    <ActionImage src={bin} alt="Delete item" onClick={() => action(item)} />
  );
}

export function ItemDisplay({ item, actions }: ItemProps) {
  return (
    <ItemContext.Provider value={item}>
      <ItemBox>
        <ItemImage src={item.imageUrl} alt="" aria-hidden="true" />
        <ItemName>{item.name}</ItemName>
        <ItemActions>{actions}</ItemActions>
      </ItemBox>
    </ItemContext.Provider>
  );
}
