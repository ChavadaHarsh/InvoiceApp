<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <AppCard class="w-full max-w-md">
      <AppTitle>Shree Balaji GST</AppTitle>
      <AppSubtitle>Simple GST & Accounting Software</AppSubtitle>

      <form @submit.prevent="submit" class="mt-4 space-y-4">
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

        <div class="mt-6">
          <AppButton :loading="loading">Login</AppButton>
        </div>
      </form>

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
import * as yup from "yup";
import { loginUser } from "../../services/auth.api";
import { setAuth } from "@/stores/auth.store";

import AppCard from "../components/AppCard.vue";
import AppInput from "../components/AppInput.vue";
import AppButton from "../components/AppButton.vue";
import AppTitle from "../components/AppTitle.vue";
import AppSubtitle from "../components/AppSubtitle.vue";
import { companyStore } from "@/stores/company.store";

const router = useRouter();

const form = ref({
  email: "",
  password: "",
});

const errors = ref({
  email: "",
  password: "",
});

const loading = ref(false);

const schema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email"),
  password: yup.string().required("Password is required"),
});

const submit = async () => {
  loading.value = true;
  errors.value = { email: "", password: "" };

  try {
    await schema.validate(form.value, { abortEarly: false });

    const res = await loginUser(form.value);

    setAuth(res.data.token, res.data.user);
    await companyStore.loadActiveCompany();

    router.push("/dashboard");
  } catch (err) {
    if (err.name === "ValidationError") {
      err.inner.forEach((e) => {
        errors.value[e.path] = e.message;
      });
    } else if (err.response?.data?.errors) {
      err.response.data.errors.forEach((e) => {
        errors.value[e.field] = e.message;
      });
    }
  } finally {
    loading.value = false;
  }
};
</script>
