<template>
  <div class="space-y-6">
    <div class="bg-white rounded shadow p-4">
      <h2 class="text-xl font-bold">
        {{ companyStore.activeCompany.name }}
      </h2>
      <p class="text-gray-600">
        GSTIN: {{ companyStore.activeCompany.gstin || "N/A" }}
      </p>
      <p class="text-gray-600">
        Address: {{ companyStore.activeCompany.address || "N/A" }}
      </p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded shadow p-4 text-center">
        <div class="text-sm text-gray-500">Total Sales</div>
        <div class="text-xl font-bold">₹ 0.00</div>
      </div>

      <div class="bg-white rounded shadow p-4 text-center">
        <div class="text-sm text-gray-500">Total Purchase</div>
        <div class="text-xl font-bold">₹ 0.00</div>
      </div>

      <div class="bg-white rounded shadow p-4 text-center">
        <div class="text-sm text-gray-500">GST Payable</div>
        <div class="text-xl font-bold">₹ 0.00</div>
      </div>

      <div class="bg-white rounded shadow p-4 text-center">
        <div class="text-sm text-gray-500">Stock Items</div>
        <div class="text-xl font-bold">0</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { companyStore } from "@/stores/company.store";
</script>
