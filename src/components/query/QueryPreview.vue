<script setup>
import { useId } from 'vue';

defineProps({
  query: {
    type: String,
    required: true,
  },
});

const headingId = useId();
</script>

<template>
  <section :aria-labelledby="headingId">
    <h3 :id="headingId" class="text-sm font-medium">Query</h3>
    <!-- aria-live set explicitly: <output>'s implicit live role isn't announced everywhere -->
    <output
      aria-live="polite"
      class="mt-2 block rounded-md bg-canvas px-3 py-2 font-mono text-sm break-words"
    >
      <code v-if="query">{{ query }}</code>
      <span v-else class="font-sans text-muted">Your query will appear here as you add terms.</span>
    </output>
  </section>
</template>
