<template>
  <button
    :disabled="loading"
    class="w-full rounded-lg bg-[#003664] text-white py-2 font-semibold hover:bg-[#002b52] transition disabled:opacity-60"
  >
    <span v-if="!loading">
      <slot />
    </span>
    <span v-else> Processing... </span>
  </button>
</template>

<script setup>
defineProps({
  loading: Boolean,
});
</script>
