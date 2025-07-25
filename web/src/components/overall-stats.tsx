import { getStatIconUrl, StatName, StatNames } from "@/services/dofus/stats";
import styled from "styled-components";

interface OverallStatsProps {
  stats: number[];
}

const StatsBlock = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: auto auto 1fr auto auto 1fr;
  gap: 4px;
`;

const Stat = styled.li`
  display: grid;
  grid-column: span 3;
  grid-template-columns: subgrid;
  align-items: center;
`;

const StatIcon = styled.img`
  height: 15px;
  width: 15px;
`;

const StatCount = styled.span``;
const StatNameContainer = styled.span`
  padding-left: 12px;
`;

export function OverallStats({ stats }: OverallStatsProps) {
  const statNames = StatNames;

  return (
    <StatsBlock>
      {stats.flatMap((count, idx) => {
        if (count === 0) return [];
        const statName = statNames[idx];
        return [
          <Stat key={statName}>
            <StatIcon src={getStatIconUrl(statName)} />
            <StatCount>{count}</StatCount>
            <StatNameContainer>{statName}</StatNameContainer>
          </Stat>,
        ];
      })}
    </StatsBlock>
  );
}

interface CharacteristicsPointsProps {
  points: number[];
}

const ORDER: [StatName, (x: number) => number][] = [
  ["Vitality", (x: number) => x],
  ["Wisdom", (x: number) => Math.floor(x / 3)],
  ["Agility", convertPointsForStat],
  ["Chance", convertPointsForStat],
  ["Strength", convertPointsForStat],
  ["Intelligence", convertPointsForStat],
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function convertPointsForStat(points: number): number {
  return (
    Math.min(points, 100) +
    Math.floor(clamp(points - 100, 0, 200) / 2) +
    Math.floor(clamp(points - 300, 0, 300) / 3) +
    Math.floor(Math.max(points - 600, 0) / 4)
  );
}

export function CharacteristicsPoints({ points }: CharacteristicsPointsProps) {
  return (
    <StatsBlock>
      {points.map((x, idx) => {
        const [stat, conversion] = ORDER[idx];

        return (
          <Stat key={stat}>
            <StatIcon src={getStatIconUrl(stat)} />
            <StatCount>{conversion(x)}</StatCount>
            <StatNameContainer>{stat}</StatNameContainer>
          </Stat>
        );
      })}
    </StatsBlock>
  );
}
