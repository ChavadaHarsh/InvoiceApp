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
        </div>

        <div class="mt-6">
          <AppButton :loading="loading">Register</AppButton>
        </div>
      </form>

      <!-- Footer -->
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
import { registerUser } from "../../services/auth.api";

import AppButton from "../components/AppButton.vue";
import AppCard from "../components/AppCard.vue";
import AppInput from "../components/AppInput.vue";
import AppTitle from "../components/AppTitle.vue";
import AppSubtitle from "../components/AppSubtitle.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const form = ref({
  name: "",
  email: "",
  password: "",
});

const errors = ref({});
const loading = ref(false);

const submit = async () => {
  errors.value = {};
  loading.value = true;

  try {
    await registerUser(form.value);

    // ✅ redirect to login after successful register
    router.push("/login");
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
