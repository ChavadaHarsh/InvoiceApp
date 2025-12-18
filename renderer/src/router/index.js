import { createRouter, createWebHashHistory } from "vue-router";
import { authStore } from "@/stores/auth.store";

const routes = [
  {
    path: "/login",
    component: () => import("@/pages/auth/Login.vue"),
    meta: { guest: true },
  },
  {
    path: "/register",
    component: () => import("@/pages/auth/Register.vue"),
    meta: { guest: true },
  },
  {
    path: "/forgot-password",
    component: () => import("@/pages/auth/ForgotPassword.vue"),
    meta: { guest: true },
  },
  {
    path: "/",
    component: () => import("@/pages/dashboard/index.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 🔐 ROUTER GUARD
router.beforeEach((to, from, next) => {
  // 🔒 Protected route but user not logged in
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/login");
    return;
  }

  // 🚫 Guest route but user already logged in
  if (to.meta.guest && authStore.isAuthenticated) {
    next("/");
    return;
  }

  next();
});

export default router;
