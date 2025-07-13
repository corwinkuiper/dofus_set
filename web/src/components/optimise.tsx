"use client";

import { SetBonusesDisplay, SetDisplay } from "./set-display";
import { OverallStats } from "./overall-stats";
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

function OptimiseButton() {
  const cancel = useCancelOptimisation();

  const { current, dispatched } = useAtomValue(optimisationProgressAtom);

  return (
    <Button type="submit">
      {(cancel && `Cancel (${current} / ${dispatched})`) || "Optimise"}
    </Button>
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

function CurrentOptimalResult() {
  const optimal = useOptimisationResult();

  if (!optimal) return null;

  return (
    <Stack $dir="h">
      <Stack $grow>
        <SetDisplay set={optimal.items} />
        <SetBonusesDisplay bonuses={optimal.setBonuses} />
      </Stack>
      <Stack>
        <div>
          Energy: <DisplayNumberAppropriately number={optimal.energy} />
        </div>
        <OverallStats stats={optimal.overallCharacteristics} />
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
