import { LocalisedString } from "@/services/dofus/optimiser";
import { languageAtom } from "@/state/languageState";
import { useAtomValue } from "jotai";
import { ReactNode } from "react";

interface LocalisedProps {
  s: LocalisedString;
}

export function Localised({ s }: LocalisedProps): ReactNode {
  const language = useAtomValue(languageAtom);

  return s[language];
}
