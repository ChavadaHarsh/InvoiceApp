<template>
  <div class="flex h-screen bg-gray-100">
    <Sidebar />

    <div class="flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>

<script setup>
import Sidebar from "@/pages/components/sidebar/Sidebar.vue";
</script>
