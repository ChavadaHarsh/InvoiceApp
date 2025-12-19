<template>
  <div class="bg-white rounded shadow">
    <div class="flex justify-between p-4 border-b">
      <h2 class="text-lg font-semibold">Companies</h2>

      <router-link to="/companies/create" class="text-[#003664] font-semibold">
        + Create Company
      </router-link>
    </div>

    <div v-if="loading" class="p-4 text-gray-500">Loading companies...</div>

    <table v-else class="w-full">
      <thead class="bg-gray-50 text-sm">
        <tr>
          <th class="p-3 text-left">Company Name</th>
          <th class="p-3 text-left">GSTIN</th>
          <th class="p-3 text-left">Address</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="company in companyStore.companies"
          :key="company.id"
          @click="select(company)"
          class="cursor-pointer hover:bg-gray-100"
        >
          <td class="p-3 font-semibold">
            {{ company.name }}
          </td>
          <td class="p-3 text-sm">
            {{ company.gstin || "-" }}
          </td>
          <td class="p-3 text-sm">
            {{ company.address || "-" }}
          </td>
        </tr>

        <tr v-if="!companyStore.companies.length">
          <td colspan="3" class="p-4 text-center text-gray-500">
            No companies found
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { fetchCompanies } from "@/services/company.api";
import { companyStore } from "@/stores/company.store";

const router = useRouter();
const loading = ref(false);

const loadCompanies = async () => {
  loading.value = true;
  try {
    const res = await fetchCompanies();
    companyStore.companies(res.data.companies);
  } finally {
    loading.value = false;
  }
};

const select = (company) => {
  companyStore.selectCompany(company);
  router.push("/dashboard");
};

onMounted(loadCompanies);
</script>
