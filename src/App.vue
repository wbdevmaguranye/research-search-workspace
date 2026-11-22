<script setup>
import AppSkipLink from '@/components/layout/AppSkipLink.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';

const MAIN_CONTENT_ID = 'main-content';
</script>

<template>
  <!-- App shell on large screens: header and footer fixed, content areas scroll on their own -->
  <div class="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
    <AppSkipLink :target-id="MAIN_CONTENT_ID" />
    <AppHeader />

    <!-- tabindex="-1" so the skip link can move focus here -->
    <!-- flex column, so a page can fill the space between header and footer -->
    <main
      :id="MAIN_CONTENT_ID"
      tabindex="-1"
      class="flex flex-1 flex-col focus:outline-none lg:min-h-0"
    >
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>
