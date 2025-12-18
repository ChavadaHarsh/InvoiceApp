<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <AppCard class="w-full max-w-md">
      <!-- Header -->
      <AppTitle>Shree Balaji GST</AppTitle>
      <AppSubtitle>Reset your account password</AppSubtitle>

      <!-- Form -->
      <form @submit.prevent="submit" class="mt-4">
        <div class="space-y-4">
          <AppInput
            label="Email Address"
            type="email"
            placeholder="Enter your registered email"
            v-model="email"
            :error="error"
          />
        </div>

        <div class="mt-6">
          <AppButton :loading="loading"> Send Reset Link </AppButton>
        </div>
      </form>

      <!-- Footer -->
      <p class="text-center text-base font-normal mt-4 text-gray-600">
        Remember your password?
        <router-link
          to="/login"
          class="ml-1 text-[#003664] font-semibold hover:underline"
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
import AppCard from "../components/AppCard.vue";
import AppInput from "../components/AppInput.vue";
import AppButton from "../components/AppButton.vue";
import AppTitle from "../components/AppTitle.vue";
import AppSubtitle from "../components/AppSubtitle.vue";
import { forgotPassword } from "@/services/auth.api";
// import { forgotPassword } from "../services/auth.api"; // when backend ready

const router = useRouter();

const email = ref("");
const error = ref("");
const loading = ref(false);

const submit = async () => {
  error.value = "";
  loading.value = true;

  try {
    await forgotPassword({ email: email.value });

    alert("Password reset instructions sent to your email.");
    router.push("/login");
  } catch (err) {
    error.value = err.response?.data?.message || "Something went wrong";
  } finally {
    loading.value = false;
  }
};
</script>
