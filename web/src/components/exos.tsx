import { getStatIconUrl, StatName } from "@/services/dofus/stats";
import { exosState } from "@/state/state";
import { useAtom } from "jotai";
import styled from "styled-components";

interface ExoProps {
  name: string;
  icon?: StatName;
  id: keyof typeof exosState.init;
}

const Icon = styled.img`
  width: 15px;
  height: 15px;
`;

const ExoWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 2px;
`;

function Exo({ name, icon, id }: ExoProps) {
  const [exos, setExos] = useAtom(exosState);
  const value = exos[id];
  const iconUrl = icon ? getStatIconUrl(icon) : undefined;

  return (
    <ExoWrapper>
      {icon && <Icon src={iconUrl} alt="" aria-hidden="true" />}
      <span>{name}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(evt) => setExos({ ...exos, [id]: evt.target.checked })}
      />
    </ExoWrapper>
  );
}

const ExosWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

export function ExosInputs() {
  return (
    <ExosWrapper>
      <Exo name="AP Exo" id="apExo" icon="AP" />
      <Exo name="MP Exo" id="mpExo" icon="MP" />
      <Exo name="Range Exo" id="rangeExo" icon="Range" />
      <Exo name="Multi" id="multiElement" />
    </ExosWrapper>
  );
}
