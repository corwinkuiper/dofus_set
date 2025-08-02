import { allItemsAtom } from "@/state/allItemsState";
import { OptimiseApiResponseItem } from "@/services/dofus/optimiser";
import { atom } from "jotai";

export const BannedItemCategoryItems = [
  "Khardboard",
  "Petsmount",
  "Pet",
  "Dragoturkey",
  "Rhineetle",
  "Seemyool",
] as const;

export type BannedItemCategory = (typeof BannedItemCategoryItems)[number];

const bannedItemFilter: Record<
  BannedItemCategory,
  (item: OptimiseApiResponseItem) => boolean
> = {
  Khardboard: (x) => x.name.en.startsWith("Khardboard"),
  Petsmount: (x) => x.itemType === "Petsmount",
  Pet: (x) => x.itemType === "Pet",
  Dragoturkey: (x) => x.name.en.endsWith("Dragoturkey"),
  Rhineetle: (x) => x.name.en.endsWith("Rhineetle"),
  Seemyool: (x) => x.name.en.endsWith("Seemyool"),
};

export const bannedItemsCategoryAtom = atom<Set<BannedItemCategory>>(
  new Set<BannedItemCategory>(["Khardboard"])
);

export const bannedItemsAtom = atom<Map<number, OptimiseApiResponseItem>>(
  new Map()
);

export const bannedItemsAllAtom = atom(async (get) => {
  const filters = Array.from(
    get(bannedItemsCategoryAtom)
      .values()
      .map((x) => bannedItemFilter[x])
  );
  const bannedItems = get(bannedItemsAtom);
  filters.push((x) => bannedItems.has(x.dofusId));
  return (await get(allItemsAtom)).filter((x) =>
    filters.some((filter) => filter(x))
  );
});
