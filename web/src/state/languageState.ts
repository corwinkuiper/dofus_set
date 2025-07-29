import { LocalisedString } from "@/services/dofus/optimiser";
import { atomWithStorage } from "jotai/utils";

export type Language = keyof LocalisedString;

export const languageAtom = atomWithStorage<Language>("language", "en");
