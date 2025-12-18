<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <AppCard class="w-full max-w-md">
      <!-- Header -->
      <AppTitle>Shree Balaji GST</AppTitle>
      <AppSubtitle>Simple GST & Accounting Software</AppSubtitle>

      <!-- Form -->
      <form @submit.prevent="submit" class="mt-4">
        <div class="space-y-4">
          <AppInput
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            v-model="form.email"
            :error="errors.email"
          />

          <AppInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            v-model="form.password"
            :error="errors.password"
          />
        </div>

        <div class="mt-6">
          <AppButton :loading="loading">Login</AppButton>
        </div>
      </form>

      <!-- Footer -->
      <div class="mt-4 text-center space-y-2">
        <router-link
          to="/forgot-password"
          class="text-base font-semibold text-[#003664] hover:underline"
        >
          Forgot password?
        </router-link>

        <p class="text-base text-gray-600">
          Don’t have an account?
          <router-link
            to="/register"
            class="ml-1 text-[#003664] font-semibold hover:underline"
          >
            Register
          </router-link>
        </p>
      </div>
    </AppCard>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "../../services/auth.api";

import AppCard from "../components/AppCard.vue";
import AppInput from "../components/AppInput.vue";
import AppButton from "../components/AppButton.vue";
import AppTitle from "../components/AppTitle.vue";
import AppSubtitle from "../components/AppSubtitle.vue";
import { setAuth } from "@/stores/auth.store";

const router = useRouter();

const form = ref({
  email: "",
  password: "",
});

const errors = ref({});
const loading = ref(false);

const submit = async () => {
  errors.value = {};
  loading.value = true;

  try {
    const res = await loginUser(form.value);

    // ✅ store token + user properly
    setAuth(res.data.token, res.data.user);

    router.push("/dashboard");
  } catch (err) {
    if (err.response?.data?.errors) {
      err.response.data.errors.forEach((e) => {
        errors.value[e.field] = e.message;
      });
    }
  } finally {
    loading.value = false;
  }
};
</script>
