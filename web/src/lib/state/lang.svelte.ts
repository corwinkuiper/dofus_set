import type { LocalisedString } from "$lib/dofus/types";

export type Language = keyof LocalisedString;

export let language = $state<{ lang: Language }>({ lang: "en" });
