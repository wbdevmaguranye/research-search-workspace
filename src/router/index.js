import { createRouter, createWebHistory } from 'vue-router';
import SearchWorkspaceView from '@/views/SearchWorkspaceView.vue';

export const routes = [
  {
    path: '/',
    name: 'search',
    component: SearchWorkspaceView,
  },
  // Single-page tool: any unknown URL goes back to the workspace.
  { path: '/:pathMatch(.*)*', redirect: { name: 'search' } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
