<script setup>
import AppSkipLink from '@/components/layout/AppSkipLink.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';

const MAIN_CONTENT_ID = 'main-content';
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppSkipLink :target-id="MAIN_CONTENT_ID" />
    <AppHeader />

    <!-- tabindex="-1" lets the skip link (and later, route changes) move focus here. -->
    <main :id="MAIN_CONTENT_ID" tabindex="-1" class="flex-1 focus:outline-none">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>
