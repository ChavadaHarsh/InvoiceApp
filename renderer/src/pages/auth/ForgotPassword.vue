<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <AppCard class="w-full max-w-md">
      <AppTitle>Shree Balaji GST</AppTitle>
      <AppSubtitle>Reset your account password</AppSubtitle>

      <form @submit.prevent="submit" class="mt-4 space-y-4">
        <AppInput
          label="Email Address"
          type="email"
          placeholder="Enter your registered email"
          v-model="form.email"
          :error="errors.email"
        />

        <AppInput
          label="New Password"
          type="password"
          placeholder="Enter new password"
          v-model="form.password"
          :error="errors.password"
        />

        <div class="mt-6">
          <AppButton :loading="loading"> Update Password </AppButton>
        </div>
      </form>

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
import * as yup from "yup";
import AppCard from "../components/AppCard.vue";
import AppInput from "../components/AppInput.vue";
import AppButton from "../components/AppButton.vue";
import AppTitle from "../components/AppTitle.vue";
import AppSubtitle from "../components/AppSubtitle.vue";
import { forgotPassword } from "@/services/auth.api";

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
  password: yup
    .string()
    .required("New password is required")
    .min(6, "Password must be at least 6 characters"),
});

const submit = async () => {
  loading.value = true;
  errors.value = { email: "", password: "" };

  try {
    await schema.validate(form.value, { abortEarly: false });

    await forgotPassword({
      email: form.value.email,
      new_password: form.value.password,
    });

    alert("Password updated successfully");
    router.push("/login");
  } catch (err) {
    if (err.name === "ValidationError") {
      err.inner.forEach((e) => {
        errors.value[e.path] = e.message;
      });
    } else {
      alert(err.response?.data?.message || "Something went wrong");
    }
  } finally {
    loading.value = false;
  }
};
</script>
