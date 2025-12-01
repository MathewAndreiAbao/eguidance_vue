import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/register', component: () => import('../views/Register.vue') },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } }
  ,  { path: '/appointments', component: () => import('../views/Appointments.vue'), meta: { requiresAuth: true } }
  ,{ path: '/wellness-forms', component: () => import('../views/WellnessForms.vue'), meta: { requiresAuth: true } }
  ,{ path: '/announcements', component: () => import('../views/Announcements.vue'), meta: { requiresAuth: true } }
  ,{ path: '/resources', component: () => import('../views/Resources.vue'), meta: { requiresAuth: true } }
  ,{ path: '/reports', component: () => import('../views/Reports.vue'), meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) return next('/login');
  if ((to.path === '/login' || to.path === '/register') && token) return next('/dashboard');
  next();
});

export default router;
