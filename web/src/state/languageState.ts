import { LocalisedString } from "@/services/dofus/optimiser";
import { atom } from "jotai";

export type Language = keyof LocalisedString;

export const languageAtom = atom<Language>("en");
