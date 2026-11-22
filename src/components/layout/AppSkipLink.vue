<script setup>
defineProps({
  targetId: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <!-- Hidden until focused: lets keyboard users skip the header -->
  <a
    :href="`#${targetId}`"
    class="sr-only rounded-md bg-accent px-4 py-2 font-medium text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
  >
    Skip to main content
  </a>
</template>
