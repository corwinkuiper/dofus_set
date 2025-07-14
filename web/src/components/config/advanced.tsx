import styled from "styled-components";
import { Stack } from "../base/stack";
import { useAtom } from "jotai";
import {
  continuousOptimisationAtom,
  initialTemperatureAtom,
  numberOfIterationsAtom,
} from "@/state/state";
import { InputDecimal } from "../base/input";

const AdvancedConfigStack = styled(Stack)`
  flex-wrap: wrap;
  gap: 16px;
`;

export function AdvancedConfig() {
  const [iterations, setIterations] = useAtom(numberOfIterationsAtom);
  const [initialTemperature, setInitialTemperature] = useAtom(
    initialTemperatureAtom
  );
  const [continuous, setContinuous] = useAtom(continuousOptimisationAtom);

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
    </AdvancedConfigStack>
  );
}
