<template>
  <router-link :to="to" class="block px-4 py-2 rounded hover:bg-white/10">
    {{ label }}
  </router-link>
</template>

<script setup>
defineProps({
  to: String,
  label: String,
});
</script>
