import { getAllItems } from "@/state/state";
import { atom } from "jotai";

export const allItemsAtom = atom(() => getAllItems());
