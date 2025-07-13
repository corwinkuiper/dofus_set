import { Atom, atom, WritableAtom } from "jotai";
import { useMemo } from "react";
import { useClientValue } from "./useClientValue";

export function useClientAtom<T, A, R>(
  a: WritableAtom<T, [A], R>,
  init: Awaited<T> | T
): WritableAtom<T, [A], R>;
export function useClientAtom<T>(a: Atom<T>, init: Awaited<T> | T): Atom<T>;
export function useClientAtom<T, A, R>(
  a: WritableAtom<T, [A], R> | Atom<T>,
  init: Awaited<T> | T
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const serverAtom = useMemo(() => atom(init), [a]);

  const shouldUseClientAtom = useClientValue(() => true);

  return shouldUseClientAtom ? a : serverAtom;
}
