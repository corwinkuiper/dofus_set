import styled from "styled-components";
import { Stack } from "../base/stack";
import { useAtom } from "jotai";
import {
  continuousOptimisationAtom,
  initialTemperatureAtom,
  numberOfIterationsAtom,
} from "@/state/state";

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
        <input
          type="number"
          value={iterations}
          onChange={(evt) => setIterations(Number(evt.target.value))}
        />
      </label>
      <label>
        Initial temperature:{" "}
        <input
          type="number"
          value={initialTemperature}
          onChange={(evt) => setInitialTemperature(Number(evt.target.value))}
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
