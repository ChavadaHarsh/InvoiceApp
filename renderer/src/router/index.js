import { createRouter, createWebHashHistory } from "vue-router";
import { authStore } from "@/stores/auth.store";

const routes = [
  {
    path: "/",
    redirect: () => {
      return authStore.isAuthenticated ? "/dashboard" : "/login";
    },
  },
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
    path: "/dashboard",
    component: () => import("@/pages/dashboard/index.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/companies/create",
    component: () => import("@/pages/companies/CompanyCreate.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/login");
    return;
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    next("/dashboard");
    return;
  }

  next();
});

export default router;
