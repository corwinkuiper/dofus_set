"use client";

import { ReactNode } from "react";
import styled, { css, RuleSet } from "styled-components";
import pin from "@/assets/pin.svg";
import search from "@/assets/search.svg";
import bin from "@/assets/bin.svg";
import {
  OptimiseApiResponseItem,
  OptimiseApiResponseSetBonus,
} from "@/services/dofus/optimiser";
import { Tooltip } from "./base/tooltip";
import { OverallStats } from "./overall-stats";
import { makeUrl } from "../services/makeUrl";
import Image from "next/image";

const ItemActions = styled.div`
  margin-left: auto;
  display: flex;
  flex-direction: row;
`;
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

type Colour = "RED";

const RED_FILTER = css`
  filter: invert(16%) sepia(80%) saturate(7500%) hue-rotate(359deg)
    brightness(100%) contrast(116%);
`;

const COLOUR_LOOKUP: Record<Colour, RuleSet> = {
  RED: RED_FILTER,
};

const ActionImage = styled(Image)<{ $colour?: Colour }>`
  ${(props) => props.$colour && COLOUR_LOOKUP[props.$colour]}

  cursor: pointer;
`;

interface ItemProps {
  item?: OptimiseApiResponseItem;
  actions?: ReactNode;
}

interface ActionProps {
  action: () => void;
  active?: boolean;
}

export function ActionPin({ action, active }: ActionProps) {
  return (
    <ActionImage
      $colour={active ? "RED" : undefined}
      src={pin}
      alt="Pin item"
      onClick={() => action()}
    />
  );
}

export function ActionSearch({ action, active }: ActionProps) {
  return (
    <ActionImage
      $colour={active ? "RED" : undefined}
      src={search}
      alt="Search"
      onClick={() => action()}
    />
  );
}

export function ActionDelete({ action, active }: ActionProps) {
  return (
    <ActionImage
      $colour={active ? "RED" : undefined}
      src={bin}
      alt="Delete item"
      onClick={() => action()}
    />
  );
}

const TooltipContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  border: solid black 1px;
  padding: 8px;
`;

export function ItemDisplay({ item, actions }: ItemProps) {
  return (
    <Tooltip
      tooltip={
        item && (
          <TooltipContainer>
            <OverallStats stats={item.characteristics} />
          </TooltipContainer>
        )
      }
    >
      <ItemBox>
        {item && (
          <>
            <ItemImage src={makeUrl(item.imageUrl)} alt="" aria-hidden="true" />
            <ItemName>{item.name}</ItemName>
          </>
        )}
        <ItemActions>{actions}</ItemActions>
      </ItemBox>
    </Tooltip>
  );
}

interface SetBonusDisplayProps {
  set: OptimiseApiResponseSetBonus;
}

export function SetBonusDisplay({ set }: SetBonusDisplayProps) {
  return (
    <Tooltip
      tooltip={
        <TooltipContainer>
          <OverallStats stats={set.characteristics} />
        </TooltipContainer>
      }
    >
      <ItemBox>
        <ItemName>
          {set.name} ({set.numberOfItems})
        </ItemName>
      </ItemBox>
    </Tooltip>
  );
}

export function EmptyItemDisplay() {
  return <ItemBox />;
}
