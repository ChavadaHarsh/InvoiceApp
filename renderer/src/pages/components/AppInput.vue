<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-base font-semibold text-gray-700">
      {{ label }}
    </label>

    <input
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003664]"
    />

    <p v-if="error" class="text-base text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  modelValue: String,
  type: {
    type: String,
    default: "text",
  },
  placeholder: String,
  error: String,
});
</script>
