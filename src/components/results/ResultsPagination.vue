<script setup>
defineProps({
  page: {
    type: Number,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
  },
  hasPrevious: {
    type: Boolean,
    required: true,
  },
  hasNext: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['previous', 'next']);

const BUTTON =
  'rounded-md border border-line-strong bg-surface px-4 py-2 font-medium hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong disabled:hover:text-ink';
</script>

<template>
  <nav aria-label="Results pages" class="flex items-center justify-between gap-4">
    <button type="button" :class="BUTTON" :disabled="!hasPrevious" @click="emit('previous')">
      <span aria-hidden="true">←</span> Previous
    </button>
    <p class="text-sm text-muted">
      Page {{ page.toLocaleString('en-GB') }} of {{ pageCount.toLocaleString('en-GB') }}
    </p>
    <button type="button" :class="BUTTON" :disabled="!hasNext" @click="emit('next')">
      Next <span aria-hidden="true">→</span>
    </button>
  </nav>
</template>
