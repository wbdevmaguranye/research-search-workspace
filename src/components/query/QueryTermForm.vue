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

const HINTS = {
  AND: 'Results must also include this term.',
  OR: 'Results can include this term instead.',
  NOT: 'Results must not include this term.',
};

const value = ref('');
const operator = ref('AND');
const error = ref('');
const inputEl = useTemplateRef('input');
const inputId = useId();
const errorId = useId();
const hintId = useId();
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
  <!-- @container: the layout follows the space this form is given, not the screen width -->
  <form novalidate class="@container" @submit.prevent="submit">
    <label :for="inputId" class="text-sm font-medium">Keyword or phrase</label>

    
    <div class="mt-2 flex flex-col gap-2 @lg:flex-row">
      <fieldset v-if="hasTerms" :aria-describedby="hintId" class="shrink-0">
        <legend class="sr-only">Combine with</legend>
        <div class="flex h-full rounded-md border border-line-strong bg-surface p-1">
          <label
            v-for="option in OPERATORS"
            :key="option"
            class="flex flex-1 cursor-pointer items-center justify-center rounded px-3 py-1.5 text-sm font-semibold has-checked:bg-accent has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent @lg:flex-none"
          >
            <input
              v-model="operator"
              type="radio"
              :name="groupName"
              :value="option"
              class="sr-only"
            />
            {{ option }}
          </label>
        </div>
      </fieldset>

      <div class="flex flex-1 gap-2">
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
          class="rounded-md bg-accent px-5 py-2 font-medium text-white hover:bg-accent-strong"
        >
          Add
        </button>
      </div>
    </div>

    <p v-if="hasTerms" :id="hintId" class="mt-2 text-sm text-muted">{{ HINTS[operator] }}</p>
    <p v-if="error" :id="errorId" role="alert" class="mt-2 text-sm text-danger">{{ error }}</p>
  </form>
</template>
