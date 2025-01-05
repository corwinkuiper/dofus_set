import { css, styled } from "styled-components";

type Direction = "h" | "v";

export const Stack = styled.div<{ $dir?: Direction; $grow?: boolean }>`
  display: flex;

  ${(props) =>
    props.$dir === undefined || props.$dir === "v"
      ? css`
          flex-direction: column;
        `
      : css`
          flex-direction: row;
        `}

  ${(props) =>
    props.$grow &&
    css`
      flex-grow: 1;
    `}
`;
