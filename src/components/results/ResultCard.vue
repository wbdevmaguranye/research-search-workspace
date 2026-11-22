<script setup>
defineProps({
  article: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <article class="rounded-lg border border-line bg-surface p-4 shadow-sm">
    <h3 class="leading-snug font-semibold">
      <a
        :href="article.url"
        target="_blank"
        rel="noopener"
        class="text-accent underline-offset-2 hover:text-accent-strong hover:underline"
      >
        {{ article.title || 'Untitled' }}
        <span class="sr-only">(opens in a new tab)</span>
        <!-- SVG, not the ↗ character, which Windows draws as a coloured emoji -->
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="inline size-3.5 align-baseline"
        >
          <path d="M6 3h7v7M13 3 4 12" />
        </svg>
      </a>
    </h3>
    <p class="mt-1 text-sm text-muted">{{ article.year || 'Year not listed' }}</p>
    <p class="mt-1 line-clamp-2 text-sm text-muted">
      {{ article.authors || 'Authors not listed' }}
    </p>
  </article>
</template>
