<script setup>
import { ref, useId, useTemplateRef } from 'vue';
import { OPERATORS, validateTerm } from '@/utils/queryBuilder';

defineProps({
  hasTerms: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['add']);

const HINTS = { AND: 'must include', OR: 'either one', NOT: 'must not include' };

const value = ref('');
const operator = ref('AND');
const error = ref('');
const inputEl = useTemplateRef('input');
const inputId = useId();
const errorId = useId();
const groupName = useId();

const focus = () => inputEl.value.focus();

const submit = () => {
  error.value = validateTerm(value.value) ?? '';
  if (!error.value) {
    emit('add', { value: value.value, operator: operator.value });
    value.value = '';
    operator.value = 'AND';
  }
  focus();
};

defineExpose({ focus });
</script>

<template>
  <form novalidate class="space-y-4" @submit.prevent="submit">
    <fieldset v-if="hasTerms">
      <legend class="text-sm font-medium">Combine with</legend>
      <div class="mt-2 grid grid-cols-3 gap-2">
        <!-- Radio hidden visually; the label is the visible, focusable-looking control -->
        <label
          v-for="option in OPERATORS"
          :key="option"
          class="flex cursor-pointer flex-col items-center rounded-md border border-line-strong bg-surface px-2 py-2 text-center has-checked:border-accent has-checked:bg-accent has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
        >
          <input
            v-model="operator"
            type="radio"
            :name="groupName"
            :value="option"
            class="sr-only"
          />
          <span class="text-sm font-semibold">{{ option }}</span>
          <span class="text-xs">{{ HINTS[option] }}</span>
        </label>
      </div>
    </fieldset>

    <div>
      <label :for="inputId" class="text-sm font-medium">Keyword or phrase</label>
      <div class="mt-2 flex gap-2">
        <input
          :id="inputId"
          ref="input"
          v-model="value"
          type="text"
          autocomplete="off"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="error ? errorId : undefined"
          class="min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-3 py-2 aria-[invalid=true]:border-danger"
          @input="error = ''"
        />
        <button
          type="submit"
          class="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong"
        >
          Add
        </button>
      </div>
      <p v-if="error" :id="errorId" role="alert" class="mt-2 text-sm text-danger">{{ error }}</p>
    </div>
  </form>
</template>
