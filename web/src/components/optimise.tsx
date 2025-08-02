"use client";

import { SetBonusesDisplay, SetDisplay } from "./set-display";
import { CharacteristicsPoints, OverallStats } from "./overall-stats";
import {
  optimisationProgressAtom,
  useCancelOptimisation,
  useDispatchOptimise,
  useOptimisationResult,
} from "@/state/state";
import { Stack } from "./base/stack";
import { OptimisationConfig } from "./config/config";
import { ReactNode } from "react";
import { Button } from "./base/button";
import { useAtomValue } from "jotai";
import { css, styled } from "styled-components";

const OptimiseButtonElement = styled(Button)<{ $active: boolean }>`
  width: 100%;
  font-size: 1rem;
  height: 3rem;
  background-color: #bcd607;
  border-color: #ffff00;
  border-width: 2px;
  border-style: solid;
  border-radius: 8px;

  ${(props) =>
    props.$active &&
    css`
      background-color: #fdb509;
      border-color: #a42805;
    `}
`;

function OptimiseButton() {
  const cancel = useCancelOptimisation();

  const { current, dispatched } = useAtomValue(optimisationProgressAtom);

  return (
    <OptimiseButtonElement type="submit" $active={!!cancel}>
      {(cancel && `Cancel (${current} / ${dispatched})`) || "Optimise"}
    </OptimiseButtonElement>
  );
}

function OptimiseForm({ children }: { children: ReactNode }) {
  const trigger = useDispatchOptimise();
  const cancel = useCancelOptimisation();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (cancel) {
          cancel("aborted by user");
        } else {
          trigger();
        }
      }}
    >
      {children}
    </form>
  );
}

interface DisplayNumberAppropriatelyProps {
  number: number;
}

function DisplayNumberAppropriately({
  number,
}: DisplayNumberAppropriatelyProps) {
  if (Math.abs(number) >= 1) {
    return number.toFixed(2);
  }

  return number;
}

const Warning = styled.div`
  color: red;
`;

function CurrentOptimalResult() {
  const optimal = useOptimisationResult();

  if (!optimal) return null;

  return (
    <Stack>
      {!optimal.valid && (
        <Warning>
          This set isn&apos;t valid, this is likely because your weights are too
          high making it energetically preferable to make invalid sets.
        </Warning>
      )}
      <Stack $dir="h">
        <Stack $grow>
          <SetDisplay set={optimal.items} />
          <SetBonusesDisplay bonuses={optimal.setBonuses} />
          {optimal.characteristics.filter((x) => x !== 0).length > 0 && (
            <CharacteristicsPoints points={optimal.characteristics} />
          )}
        </Stack>
        <Stack>
          <div>
            Energy: <DisplayNumberAppropriately number={optimal.energy} />
          </div>
          <OverallStats stats={optimal.overallCharacteristics} />
        </Stack>
      </Stack>
    </Stack>
  );
}

export function Optimise() {
  return (
    <Stack>
      <Stack>
        <OptimiseForm>
          <OptimisationConfig />
          <OptimiseButton />
        </OptimiseForm>
      </Stack>
      <CurrentOptimalResult />
    </Stack>
  );
}
