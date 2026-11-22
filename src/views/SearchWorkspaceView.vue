<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Search the literature</h1>
    <p class="mt-2 max-w-prose text-muted">
      Add keywords or phrases, choose how they combine, and explore matching publications from
      Europe PMC.
    </p>

    <div class="mt-8 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <section
        aria-labelledby="query-heading"
        class="rounded-lg border border-line bg-surface p-5 shadow-sm lg:sticky lg:top-6"
      >
        <h2 id="query-heading" class="text-lg font-semibold">Build your query</h2>
        <!-- Query builder: step 5 -->
      </section>

      <section aria-labelledby="results-heading">
        <h2 id="results-heading" class="text-lg font-semibold">Results</h2>
        <!-- Results and pagination: step 6 -->
      </section>
    </div>
  </div>
</template>
