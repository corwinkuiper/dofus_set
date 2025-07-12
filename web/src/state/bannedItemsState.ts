import { allItemsAtom } from "@/state/allItemsState";
import { OptimiseApiResponseItem } from "@/services/dofus/optimiser";
import { atom, SetStateAction } from "jotai";

const bannedItemsInnerAtom = atom<Map<
  number,
  OptimiseApiResponseItem
> | null>();

export const bannedItemsAtom = atom(
  async (get) => {
    const atom = get(bannedItemsInnerAtom);
    if (!atom) {
      const allItems = await get(allItemsAtom);
      const map = new Map(
        allItems
          .filter((x) => x.name.startsWith("Khardboard"))
          .map((x) => [x.dofusId, x])
      );
      return map;
    } else {
      return atom;
    }
  },
  async (
    get,
    set,
    newValue: SetStateAction<Map<number, OptimiseApiResponseItem>>
  ) => {
    if (typeof newValue === "function") {
      const defaultBanned = await get(bannedItemsAtom);
      set(bannedItemsInnerAtom, (value) => newValue(value ?? defaultBanned));
    } else {
      set(bannedItemsInnerAtom, newValue);
    }
  }
);
