"use client";

import Image from "next/image";
import { createContext, ReactNode, useContext } from "react";
import styled from "styled-components";
import pin from "@/assets/pin.svg";
import search from "@/assets/search.svg";
import bin from "@/assets/bin.svg";
import { OptimiseApiResponseItem } from "@/services/dofus/optimiser";

const ItemActions = styled.div``;
const ItemName = styled.span`
  font-size: 0.8rem;
`;
const ItemImage = styled.img`
  width: 50px;
  height: 50px;
`;

const ItemBox = styled.div`
  display: flex;
  border-radius: 4px;
  background-color: lightgray;
  margin: 8px;
  padding-right: 8px;
`;

const ActionImage = styled(Image)``;

interface ItemProps {
  item: OptimiseApiResponseItem;
  actions?: ReactNode;
}

interface ActionProps {
  action: (item: OptimiseApiResponseItem) => void;
}

const ItemContext = createContext<OptimiseApiResponseItem | null>(null);
function useItem(): OptimiseApiResponseItem {
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

function makeUrl(imageUrl: string): string {
  return `https://d2iuiayak06k8j.cloudfront.net/${imageUrl}`;
}

export function ItemDisplay({ item, actions }: ItemProps) {
  return (
    <ItemContext.Provider value={item}>
      <ItemBox>
        <ItemImage src={makeUrl(item.imageUrl)} alt="" aria-hidden="true" />
        <ItemName>{item.name}</ItemName>
        <ItemActions>{actions}</ItemActions>
      </ItemBox>
    </ItemContext.Provider>
  );
}

export function EmptyItemDisplay() {
  return <ItemBox />;
}
