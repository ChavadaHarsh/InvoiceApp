<template>
  <DashboardLayout>
    <div class="p-6">
      <CompanySelect v-if="!companyStore.activeCompany" />

      <DashboardHome v-else />
    </div>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from "@/layouts/DashboardLayout.vue";

import { companyStore } from "@/stores/company.store";

import CompanySelect from "../companies/CompanySelect.vue";
import DashboardHome from "./DashboardHome.vue";
</script>
