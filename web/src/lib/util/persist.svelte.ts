import { onMount } from "svelte";

export function persistState<T extends {}>(key: string, state: T) {
  onMount(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      Object.assign(state, JSON.parse(stored));
    }
  });

  $effect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  });
}
