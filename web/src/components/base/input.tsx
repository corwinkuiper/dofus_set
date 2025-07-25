import { useValueChanged } from "@/hooks/useValueChanged";
import { useState } from "react";
import { styled } from "styled-components";

const ThisInput = styled.input`
  min-width: 0;
`;

interface InputDecimalProps {
  value: number | null;
  onChange: (x: number) => void;
  className?: string;
  id?: string;
}

function makeNumberRepresentation(value: string): number | null {
  const trimmed = value.replaceAll(/ /g, "");
  if (trimmed === "-") return 0;
  const n = Number(trimmed);
  if (isFinite(n)) {
    return n;
  }

  return null;
}

function formatNumber(value: string): string {
  const number = makeNumberRepresentation(value);

  if (number) {
    const numberAsString = number.toString();
    if (numberAsString.includes("e")) return numberAsString;
    const parts = numberAsString.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
  }

  return value;
}

export function InputDecimal({ value, onChange, ...rest }: InputDecimalProps) {
  const [stringInput, setStringInput] = useState(value?.toString() ?? "");

  const valueChanged = useValueChanged(value);

  const numberFromString = makeNumberRepresentation(stringInput);

  if (valueChanged && numberFromString !== value) {
    setStringInput(value?.toString() ?? "");
  }
  const change = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const desired = evt.target.value;
    setStringInput(desired);
  };

  return (
    <ThisInput
      type="text"
      inputMode="decimal"
      pattern="^[0-9 ]*(\.[0-9]*)?$|^[0-9]+e[0-9\-]+$"
      onChange={change}
      value={stringInput}
      onBlur={() => {
        onChange(makeNumberRepresentation(stringInput) ?? 0);
        setStringInput(formatNumber(stringInput));
      }}
      {...rest}
    />
  );
}

export function InputInteger({ value, onChange, ...rest }: InputDecimalProps) {
  const [stringInput, setStringInput] = useState(value?.toString() ?? "");

  const valueChanged = useValueChanged(value);

  const numberFromString = makeNumberRepresentation(stringInput);

  if (valueChanged && numberFromString !== value) {
    setStringInput(value?.toString() ?? "");
  }
  const change = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const desired = evt.target.value;
    setStringInput(desired);
  };

  return (
    <ThisInput
      type="text"
      inputMode="numeric"
      pattern="[0-9 ]*"
      onChange={change}
      value={stringInput}
      onBlur={() => {
        onChange(makeNumberRepresentation(stringInput) ?? 0);
        setStringInput(formatNumber(stringInput));
      }}
      {...rest}
    />
  );
}
