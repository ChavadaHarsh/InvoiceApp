<template>
  <Toast />
  <router-view />
</template>
<script setup>
import Toast from "primevue/toast";
import { authStore, clearAuth } from "./stores/auth.store";
import { isTokenExpired } from "./utils/token";
import { logout } from "./services/auth.api";
const token = authStore.token;

if (token && isTokenExpired(token)) {
  clearAuth();
  logout(authStore.user.id);
}
</script>
