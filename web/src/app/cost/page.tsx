"use client";

const Outer = styled(Stack)`
  align-items: center;
  flex-grow: 1;
`;

const Container = styled(Stack)`
  width: 80%;
  flex-grow: 1;
`;

const TextArea = styled.textarea`
  min-height: 12rem;
`;

import { Stack } from "@/components/base/stack";
import { useMemo, useState } from "react";
import { styled } from "styled-components";

const ITEM_REGEX = /(\d+) x \[([^\]]+)\] \(([\d, ]+) kamas\)/g;

export default function Page() {
  const [input, setInput] = useState("");

  const total = useMemo(
    () =>
      input
        .matchAll(ITEM_REGEX)
        .map((x) => Number(x[3].replaceAll(/[, ]/g, "")))
        .reduce((a, b) => a + b, 0),
    [input]
  );

  console.log(total);

  return (
    <Outer>
      <h1>Item cost totaller</h1>
      <Container>
        <span>
          Paste in chat log containing when you bought some items to see how
          much it cost you
        </span>
        <TextArea
          value={input}
          onChange={(evt) => setInput(evt.target.value)}
        />
        <span>Total cost: {total.toLocaleString("en")} kamas</span>
      </Container>
    </Outer>
  );
}
