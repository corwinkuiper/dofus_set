<script lang="ts">
  import type { LocalisedString } from "$lib/dofus/types";
  import { language } from "$lib/state/lang.svelte";

  let { text }: { text: LocalisedString } = $props();
</script>

{text[language.lang]}
