import { reactive } from "vue";
import {
  fetchCompanies,
  selectCompanyApi,
  switchCompanyApi,
  fetchActiveCompany,
} from "@/services/company.api";

export const companyStore = reactive({
  companies: [],
  activeCompany: null,
  loading: false,

  async loadCompanies() {
    this.loading = true;
    const res = await fetchCompanies();
    this.companies = res.data.companies;
    this.loading = false;
  },

  async loadActiveCompany() {
    const res = await fetchActiveCompany();
    this.activeCompany = res.data.company;
  },

  async selectCompany(company) {
    await selectCompanyApi(company.id);
    this.activeCompany = company;
  },

  async switchCompany() {
    await switchCompanyApi();
    this.activeCompany = null;
  },
});
