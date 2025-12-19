<template>
  <div class="w-64 bg-[#003664] text-white flex flex-col">
    <div class="p-4 border-b border-white/20">
      <div class="text-xs opacity-80">Active Company</div>

      <div class="font-semibold truncate">
        {{ companyStore.activeCompany?.name || "No Company Selected" }}
      </div>

      <div class="text-xs opacity-70">
        {{ companyStore.activeCompany?.gstin || "" }}
      </div>

      <button
        v-if="companyStore.activeCompany"
        @click="switchCompany"
        class="mt-2 text-xs underline opacity-90"
      >
        Switch Company
      </button>
    </div>

    <nav class="flex-1 px-2 py-3 space-y-1">
      <SidebarItem to="/dashboard" label="Dashboard" />
      <SidebarItem to="/companies/create" label="Create Company" />
    </nav>

    <div class="p-4 border-t border-white/20">
      <button
        @click="logout"
        class="w-full text-left text-sm font-semibold hover:underline"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { companyStore } from "@/stores/company.store";
import { clearAuth } from "@/stores/auth.store";
import SidebarItem from "./SidebarItem.vue";

const router = useRouter();

const switchCompany = async () => {
  await companyStore.switchCompany();
  router.push("/dashboard");
};

const logout = () => {
  companyStore.switchCompany();
  clearAuth();
  router.push("/login");
};
</script>
