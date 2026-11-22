<script setup>
import { nextTick, useId, useTemplateRef } from 'vue';
import { OPERATORS } from '@/utils/queryBuilder';

defineProps({
  terms: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['remove', 'update-operator', 'clear']);

const headingId = useId();
const selectIdPrefix = useId();
const listEl = useTemplateRef('list');

// Keep keyboard focus in the list: move it to the term that takes the removed one's place
const remove = async (id, index) => {
  emit('remove', id);
  await nextTick();
  const buttons = listEl.value?.querySelectorAll('[data-remove]') ?? [];
  buttons[Math.min(index, buttons.length - 1)]?.focus();
};
</script>

<template>
  <section :aria-labelledby="headingId">
    <div class="flex items-center justify-between">
      <h3 :id="headingId" class="text-sm font-medium">Your terms</h3>
      <button
        type="button"
        class="text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
        @click="emit('clear')"
      >
        Clear all
      </button>
    </div>

    <!-- Chips wrap onto new rows, so many terms stay compact -->
    <ol ref="list" role="list" class="mt-2 flex flex-wrap gap-2">
      <li
        v-for="(term, index) in terms"
        :key="term.id"
        class="flex max-w-full items-center gap-2 rounded-md border border-line bg-canvas py-1 pr-1 pl-3"
      >
        <template v-if="index > 0">
          <label :for="`${selectIdPrefix}-${term.id}`" class="sr-only">
            How to combine {{ term.value }}
          </label>
          <select
            :id="`${selectIdPrefix}-${term.id}`"
            :value="term.operator"
            class="rounded border border-line-strong bg-surface px-1 py-0.5 text-sm font-semibold"
            @change="emit('update-operator', term.id, $event.target.value)"
          >
            <option v-for="option in OPERATORS" :key="option" :value="option">{{ option }}</option>
          </select>
        </template>

        <span class="min-w-0 break-words">{{ term.value }}</span>

        <button
          type="button"
          data-remove
          :aria-label="`Remove ${term.value}`"
          class="grid size-8 shrink-0 place-items-center rounded text-muted hover:text-ink"
          @click="remove(term.id, index)"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </li>
    </ol>
  </section>
</template>
