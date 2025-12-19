<template>
  <DashboardLayout>
    <div class="p-6 max-w-xl">
      <h2 class="text-xl font-bold mb-4">Create Company</h2>

      <form @submit.prevent="submit" class="space-y-4">
        <AppInput label="Company Name" v-model="form.name" />
        <AppInput label="GSTIN" v-model="form.gstin" />
        <AppInput label="Address" v-model="form.address" />

        <AppButton :loading="loading"> Save Company </AppButton>
      </form>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref } from "vue";

import { companyStore } from "@/stores/company.store";
import AppInput from "../components/AppInput.vue";
import AppButton from "../components/AppButton.vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import { createCompany } from "@/services/company.api";
import { useRouter } from "vue-router";

const router = useRouter();
const form = ref({
  name: "",
  gstin: "",
  address: "",
});

const loading = ref(false);

const submit = async () => {
  loading.value = true;

  const res = await createCompany(form.value);
  companyStore.companies.unshift(res.data.company);

  loading.value = false;
  router.push("/dashboard");
};
</script>
