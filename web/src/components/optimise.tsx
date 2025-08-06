"use client";

import {
  optimisationProgressAtom,
  useCancelOptimisation,
  useDispatchOptimise,
} from "@/state/state";
import { Stack } from "./base/stack";
import { OptimisationConfig } from "./config/config";
import { ReactNode } from "react";
import { Button } from "./base/button";
import { useAtomValue } from "jotai";
import { css, styled } from "styled-components";
import { CurrentOptimalResult } from "./optimal-set";

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
