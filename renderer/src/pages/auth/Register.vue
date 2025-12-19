<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <AppCard class="w-full max-w-md">
      <AppTitle>Shree Balaji GST</AppTitle>
      <AppSubtitle>Simple GST & Accounting Software</AppSubtitle>

      <form @submit.prevent="submit" class="mt-4 space-y-4">
        <AppInput
          label="Full Name"
          placeholder="Enter your name"
          v-model="form.name"
          :error="errors.name"
        />

        <AppInput
          label="Email Address"
          type="email"
          placeholder="Enter email"
          v-model="form.email"
          :error="errors.email"
        />

        <AppInput
          label="Password"
          type="password"
          placeholder="Enter password"
          v-model="form.password"
          :error="errors.password"
        />

        <div class="mt-6">
          <AppButton :loading="loading"> Register </AppButton>
        </div>
      </form>

      <p class="text-center text-base mt-4 text-gray-600">
        Already have an account?
        <router-link
          to="/login"
          class="text-[#003664] font-semibold hover:underline"
        >
          Login
        </router-link>
      </p>
    </AppCard>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import * as yup from "yup";
import { registerUser } from "../../services/auth.api";

import AppButton from "../components/AppButton.vue";
import AppCard from "../components/AppCard.vue";
import AppInput from "../components/AppInput.vue";
import AppTitle from "../components/AppTitle.vue";
import AppSubtitle from "../components/AppSubtitle.vue";

const router = useRouter();

const form = ref({
  name: "",
  email: "",
  password: "",
});

const errors = ref({
  name: "",
  email: "",
  password: "",
});

const loading = ref(false);

const schema = yup.object({
  name: yup.string().required("Full name is required"),
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

const submit = async () => {
  loading.value = true;
  errors.value = { name: "", email: "", password: "" };

  try {
    await schema.validate(form.value, { abortEarly: false });

    await registerUser(form.value);

    router.push("/login");
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
