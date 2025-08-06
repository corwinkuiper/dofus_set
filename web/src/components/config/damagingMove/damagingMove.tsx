import { Stack } from "@/components/base/stack";
import { DamagingMoveSpellInput } from "./damagingMoveSpellInput";
import { DamagingMoveRawInput } from "./damagingMoveRawInput";
import { styled } from "styled-components";

const DamagingMoveStack = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
`;

export function DamagingMoveInput() {
  return (
    <DamagingMoveStack>
      <Stack>
        <h3>Class spell input</h3>
        <DamagingMoveSpellInput />
      </Stack>
      <Stack>
        <h3>Raw move input</h3>
        <DamagingMoveRawInput />
      </Stack>
    </DamagingMoveStack>
  );
}
