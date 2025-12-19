<template>
  <Toast />
  <router-view />
</template>
<script setup>
import Toast from "primevue/toast";
import { authStore, clearAuth } from "./stores/auth.store";
import { isTokenExpired } from "./utils/token";
import { logout } from "./services/auth.api";
import { onMounted } from "vue";
import { companyStore } from "./stores/company.store";
const token = authStore.token;

if (token && isTokenExpired(token)) {
  clearAuth();
  logout(authStore.user.id);
}
onMounted(() => {
  if (authStore.isAuthenticated) {
    companyStore.loadActiveCompany();
  }
});
</script>
