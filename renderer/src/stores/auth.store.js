import { reactive } from "vue";

const token = localStorage.getItem("token");
const user = localStorage.getItem("user");

export const authStore = reactive({
  token: token || null,
  user: user ? JSON.parse(user) : null,
  isAuthenticated: !!token,
});

export const setAuth = (token, user) => {
  authStore.token = token;
  authStore.user = user;
  authStore.isAuthenticated = true;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  authStore.token = null;
  authStore.user = null;
  authStore.isAuthenticated = false;
};
