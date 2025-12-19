<template>
  <div class="bg-white rounded shadow p-4">
    <div class="flex justify-between mb-3">
      <h2 class="font-semibold text-lg">Select Company</h2>

      <router-link to="/companies/create" class="text-[#003664] font-semibold">
        + Create Company
      </router-link>
    </div>

    <ul class="divide-y">
      <li
        v-for="company in companyStore.companies"
        :key="company.id"
        @click="select(company)"
        class="p-3 cursor-pointer hover:bg-gray-100"
      >
        <div class="font-semibold">{{ company.name }}</div>
        <div class="text-sm text-gray-500">
          {{ company.gstin }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { companyStore } from "@/stores/company.store";

const router = useRouter();

onMounted(() => {
  companyStore.loadCompanies();
});

const select = async (company) => {
  await companyStore.selectCompany(company);
  router.push("/dashboard");
};
</script>
