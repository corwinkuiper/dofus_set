import { useState } from "react";

export function useValueChanged<T>(value: T): boolean {
  const [current, setCurrent] = useState(value);

  if (value !== current) {
    setCurrent(value);

    return true;
  }
  return false;
}
