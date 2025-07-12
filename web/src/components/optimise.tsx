"use client";

import { SetBonusesDisplay, SetDisplay } from "./set-display";
import { OverallStats } from "./overall-stats";
import {
  useCancelOptimisation,
  useDispatchOptimise,
  useOptimisationResult,
} from "@/state/state";
import { Stack } from "./base/stack";
import { OptimisationConfig } from "./config/config";
import { ReactNode } from "react";
import { Button } from "./base/button";

function OptimiseButton() {
  const cancel = useCancelOptimisation();

  return <Button type="submit">{(cancel && "Cancel") || "Optimise"}</Button>;
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
          trigger(1000000);
        }
      }}
    >
      {children}
    </form>
  );
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
