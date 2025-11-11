<script lang="ts">
  import binImg from "$lib/assets/bin.svg";
  import pinImg from "$lib/assets/pin.svg";
  import searchImg from "$lib/assets/search.svg";

  let {
    pin,
    bin,
    search,
    pinActive,
    binActive,
    searchActive,
  }: {
    pin?: () => void;
    bin?: () => void;
    search?: () => void;
    pinActive?: boolean;
    binActive?: boolean;
    searchActive?: boolean;
  } = $props();
</script>

<div>
  {#if pin}
    <button type="button" onclick={pin}
      ><img class={[{ red: pinActive }]} alt="Pin" src={pinImg} /></button
    >
  {/if}
  {#if bin}
    <button type="button" onclick={bin}
      ><img class={[{ red: binActive }]} alt="Bin" src={binImg} /></button
    >
  {/if}
  {#if search}
    <button type="button" onclick={search}
      ><img
        class={[{ red: searchActive }]}
        alt="Search"
        src={searchImg}
      /></button
    >
  {/if}
</div>

<style>
  .red {
    filter: invert(16%) sepia(80%) saturate(7500%) hue-rotate(359deg)
      brightness(100%) contrast(116%);
  }
  button {
    all: unset;
    cursor: pointer;
  }
</style>
