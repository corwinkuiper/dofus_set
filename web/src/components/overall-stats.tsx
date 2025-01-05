import { getStatIconUrl, StatNames } from "@/services/dofus/stats";
import styled from "styled-components";

interface OverallStatsProps {
  stats: number[];
}

const StatsBlock = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 4px;
`;

const Stat = styled.li`
  display: grid;
  grid-column: 1 / 4;
  grid-template-columns: subgrid;
  align-items: center;
`;

const StatIcon = styled.img`
  height: 15px;
  width: 15px;
`;

const StatCount = styled.span``;
const StatName = styled.span`
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
            <StatName>{statName}</StatName>
          </Stat>,
        ];
      })}
    </StatsBlock>
  );
}
