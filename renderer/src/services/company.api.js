import api from "./api";

export const fetchCompanies = () => {
  return api.get("/companies");
};

export const createCompany = (payload) => {
  return api.post("/companies", payload);
};

export const selectCompanyApi = (companyId) => {
  return api.post("/companies/select", {
    company_id: companyId,
  });
};

export const switchCompanyApi = () => {
  return api.post("/companies/switch");
};

export const fetchActiveCompany = () => {
  return api.get("/companies/active");
};
