import styled from "styled-components";
import { Stack } from "../base/stack";
import { useAtom } from "jotai";
import {
  considerCharacteristicsAtom,
  continuousOptimisationAtom,
  initialTemperatureAtom,
  numberOfIterationsAtom,
} from "@/state/state";
import { InputDecimal } from "../base/input";
import { Tooltip } from "../base/tooltip";

const AdvancedConfigStack = styled(Stack)`
  flex-wrap: wrap;
  gap: 16px;
`;

const TooltipBox = styled.div`
  background-color: white;
  border: 1px solid black;
  border-radius: 8px;
  padding: 4px;
`;

export function AdvancedConfig() {
  const [iterations, setIterations] = useAtom(numberOfIterationsAtom);
  const [initialTemperature, setInitialTemperature] = useAtom(
    initialTemperatureAtom
  );
  const [continuous, setContinuous] = useAtom(continuousOptimisationAtom);
  const [characteristics, setCharacteristics] = useAtom(
    considerCharacteristicsAtom
  );

  return (
    <AdvancedConfigStack $dir="h">
      <label>
        Number of iterations:{" "}
        <InputDecimal
          value={iterations}
          onChange={(evt) => setIterations(evt)}
        />
      </label>
      <label>
        Initial temperature:{" "}
        <InputDecimal
          value={initialTemperature}
          onChange={(evt) => setInitialTemperature(evt)}
        />
      </label>
      <label>
        Continuous optimisation:{" "}
        <input
          type="checkbox"
          checked={continuous}
          onChange={(evt) => setContinuous(evt.target.checked)}
        />
      </label>
      <label>
        <Tooltip
          tooltip={
            <TooltipBox>
              You may want to consider increasing the number of iterations to
              make this more accurate
            </TooltipBox>
          }
        >
          Consider characteristics points:{" "}
          <input
            type="checkbox"
            checked={characteristics}
            onChange={(evt) => setCharacteristics(evt.target.checked)}
          />
        </Tooltip>
      </label>
    </AdvancedConfigStack>
  );
}
