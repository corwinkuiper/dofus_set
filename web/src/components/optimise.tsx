"use client";

import { SetDisplay } from "./set-display";
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

export function Optimise() {
  const optimal = useOptimisationResult();

  return (
    <Stack>
      <Stack>
        <OptimiseForm>
          <OptimisationConfig />
          <OptimiseButton />
        </OptimiseForm>
      </Stack>
      <Stack $dir="h">
        <Stack $grow>{optimal && <SetDisplay set={optimal.items} />}</Stack>
        <Stack>
          {optimal && <OverallStats stats={optimal.overallCharacteristics} />}
        </Stack>
      </Stack>
    </Stack>
  );
}
