import { LocalisedString } from "@/services/dofus/optimiser";
import { languageAtom } from "@/state/languageState";
import { useAtomValue } from "jotai";

export function useLocalised(l: LocalisedString | null) {
  const lang = useAtomValue(languageAtom);

  if (!l) return "";

  return l[lang];
}
