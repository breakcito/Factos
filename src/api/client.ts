import type {
  ApiKey,
  Company,
  DashboardStats,
  Despatch,
  Document,
  SystemSettingsData,
  User,
} from "./types";

const API_BASE = `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/v1`;

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  return localStorage.getItem("factos_token");
}

export function setToken(token: string): void {
  localStorage.setItem("factos_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("factos_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    const message =
      (isJson &&
        (data.message ||
          (data.errors && Object.values(data.errors).flat().join(", ")))) ||
      response.statusText ||
      "Error en la petición";

    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: async (
      email: string,
      password: string,
    ): Promise<{ token: string; user: User }> => {
      const res = await request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      return res;
    },
    me: async (): Promise<{ user: User }> => {
      return request<{ user: User }>("/auth/me");
    },
    logout: async (): Promise<void> => {
      try {
        await request("/auth/logout", { method: "POST" });
      } finally {
        removeToken();
      }
    },
  },

  // Dashboard
  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      const res = await request<{ status: string; data: DashboardStats }>(
        "/admin/dashboard",
      );
      return res.data;
    },
  },

  // Companies
  companies: {
    getAll: async (params?: {
      user_id?: number;
      search?: string;
      is_production?: boolean;
      is_active?: boolean;
    }): Promise<Company[]> => {
      const query = new URLSearchParams();
      if (params?.user_id) query.append("user_id", params.user_id.toString());
      if (params?.search) query.append("search", params.search);
      if (params?.is_production !== undefined)
        query.append("is_production", String(params.is_production));
      if (params?.is_active !== undefined)
        query.append("is_active", String(params.is_active));

      const res = await request<{ status: string; data: Company[] }>(
        `/companies${query.toString() ? `?${query.toString()}` : ""}`,
      );
      return res.data;
    },
    getById: async (id: string): Promise<Company> => {
      const res = await request<{ status: string; data: Company }>(
        `/companies/${id}`,
      );
      return res.data;
    },
    createTestCompany: async (): Promise<Company> => {
      const res = await request<{ status: string; message: string; data: Company }>(
        "/companies/test-company",
        {
          method: "POST",
        },
      );
      return res.data;
    },
    create: async (formData: FormData): Promise<Company> => {
      const res = await request<{ status: string; data: Company }>(
        "/companies",
        {
          method: "POST",
          body: formData,
        },
      );
      return res.data;
    },
    update: async (id: string, formData: FormData): Promise<Company> => {
      // For Laravel file uploads in PUT/PATCH requests, we use POST with _method=PUT
      formData.append("_method", "PUT");
      const res = await request<{ status: string; data: Company }>(
        `/companies/${id}`,
        {
          method: "POST",
          body: formData,
        },
      );
      return res.data;
    },
    delete: async (id: string): Promise<void> => {
      await request(`/companies/${id}`, { method: "DELETE" });
    },
    getWebhooks: async (id: string): Promise<any> => {
      const res = await request<{ status: string; data: any }>(
        `/companies/${id}/webhooks`,
      );
      return res.data;
    },
  },

  // Documents
  documents: {
    getAll: async (params?: {
      company_id?: string;
      type_code?: string;
      series?: string;
      status?: string;
      is_production?: boolean;
      is_test?: boolean;
      date_from?: string;
      date_to?: string;
      search?: string;
      page?: number;
      per_page?: number;
    }): Promise<{
      data: Document[];
      current_page: number;
      last_page: number;
      total: number;
    }> => {
      const query = new URLSearchParams();
      if (params?.company_id) query.append("company_id", params.company_id);
      if (params?.type_code) query.append("type_code", params.type_code);
      if (params?.series) query.append("series", params.series);
      if (params?.status) query.append("status", params.status);
      if (params?.is_production !== undefined)
        query.append("is_production", params.is_production ? "1" : "0");
      if (params?.is_test !== undefined)
        query.append("is_test", params.is_test ? "1" : "0");
      if (params?.date_from) query.append("date_from", params.date_from);
      if (params?.date_to) query.append("date_to", params.date_to);
      if (params?.search) query.append("search", params.search);
      if (params?.page) query.append("page", params.page.toString());
      if (params?.per_page)
        query.append("per_page", params.per_page.toString());

      const res = await request<{
        status: string;
        data: {
          data: Document[];
          current_page: number;
          last_page: number;
          total: number;
        };
      }>(`/documents${query.toString() ? `?${query.toString()}` : ""}`);
      return res.data;
    },
    getById: async (id: string): Promise<Document> => {
      const res = await request<{ status: string; data: Document }>(
        `/documents/${id}`,
      );
      return res.data;
    },
    void: async (id: string, reason: string): Promise<any> => {
      return request(`/documents/${id}/void`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    getXmlUrl: (id: string) => `${API_BASE}/documents/${id}/xml`,
    getCdrUrl: (id: string) => `${API_BASE}/documents/${id}/cdr`,
    getPdfUrl: (id: string) => `${API_BASE}/documents/${id}/pdf`,
    getVoidXmlUrl: (id: string) => `${API_BASE}/documents/${id}/void-xml`,
    getVoidCdrUrl: (id: string) => `${API_BASE}/documents/${id}/void-cdr`,
  },

  // Despatches (GRE)
  despatches: {
    getAll: async (params?: {
      company_id?: string;
      series?: string;
      status?: string;
      is_production?: boolean;
      is_test?: boolean;
      date_from?: string;
      date_to?: string;
      search?: string;
      page?: number;
      per_page?: number;
    }): Promise<{
      data: Despatch[];
      current_page: number;
      last_page: number;
      total: number;
    }> => {
      const query = new URLSearchParams();
      if (params?.company_id) query.append("company_id", params.company_id);
      if (params?.series) query.append("series", params.series);
      if (params?.status) query.append("status", params.status);
      if (params?.is_production !== undefined)
        query.append("is_production", params.is_production ? "1" : "0");
      if (params?.is_test !== undefined)
        query.append("is_test", params.is_test ? "1" : "0");
      if (params?.date_from) query.append("date_from", params.date_from);
      if (params?.date_to) query.append("date_to", params.date_to);
      if (params?.search) query.append("search", params.search);
      if (params?.page) query.append("page", params.page.toString());
      if (params?.per_page)
        query.append("per_page", params.per_page.toString());

      const res = await request<{
        status: string;
        data: {
          data: Despatch[];
          current_page: number;
          last_page: number;
          total: number;
        };
      }>(`/despatches${query.toString() ? `?${query.toString()}` : ""}`);
      return res.data;
    },
    getById: async (id: string): Promise<Despatch> => {
      const res = await request<{ status: string; data: Despatch }>(
        `/despatches/${id}`,
      );
      return res.data;
    },
    void: async (id: string, reason: string): Promise<any> => {
      return request(`/despatches/${id}/void`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    getXmlUrl: (id: string) => `${API_BASE}/despatches/${id}/xml`,
    getCdrUrl: (id: string) => `${API_BASE}/despatches/${id}/cdr`,
    getPdfUrl: (id: string) => `${API_BASE}/despatches/${id}/pdf`,
  },

  // Users (Admin only)
  users: {
    getAll: async (params?: {
      search?: string;
      role?: string;
      is_active?: boolean;
    }): Promise<User[]> => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.role) query.append("role", params.role);
      if (params?.is_active !== undefined)
        query.append("is_active", String(params.is_active));

      const res = await request<{ status: string; data: User[] }>(
        `/admin/users${query.toString() ? `?${query.toString()}` : ""}`,
      );
      return res.data;
    },
    getById: async (id: number): Promise<User> => {
      const res = await request<{ status: string; data: User }>(
        `/admin/users/${id}`,
      );
      return res.data;
    },
    create: async (userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
      is_active?: boolean;
      create_test_company?: boolean;
    }): Promise<{ user: User; api_key: string; test_company?: Company | null }> => {
      const res = await request<{
        status: string;
        message: string;
        data: {
          user: User;
          api_key: string;
          test_company?: Company | null;
        };
      }>("/admin/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      return res.data;
    },
    update: async (
      id: number,
      userData: {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
        is_active?: boolean;
      },
    ): Promise<User> => {
      const res = await request<{ status: string; data: User }>(
        `/admin/users/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(userData),
        },
      );
      return res.data;
    },
    delete: async (id: number): Promise<void> => {
      await request(`/admin/users/${id}`, { method: "DELETE" });
    },
    createToken: async (
      id: number,
      token_name?: string,
    ): Promise<{ token: string }> => {
      const res = await request<{ status: string; token: string }>(
        `/admin/users/${id}/token`,
        {
          method: "POST",
          body: JSON.stringify({ token_name }),
        },
      );
      return res;
    },
  },

  // System Settings (Admin only)
  settings: {
    get: async (): Promise<SystemSettingsData> => {
      const res = await request<{ status: string; data: SystemSettingsData }>(
        "/admin/settings",
      );
      return res.data;
    },
    update: async (data: Partial<SystemSettingsData>): Promise<void> => {
      await request("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    testMail: async (payload: {
      recipient: string;
      mail_host?: string;
      mail_port?: number;
      mail_username?: string;
      mail_password?: string;
      mail_encryption?: string;
      mail_from_address?: string;
      mail_from_name?: string;
    }): Promise<{ message: string }> => {
      return request("/admin/settings/test-mail", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    testApisPeru: async (payload: {
      type: "dni" | "ruc" | "tc";
      query?: string;
      token?: string;
      source?: "sunat" | "sbs";
    }): Promise<any> => {
      return request("/admin/settings/test-apisperu", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },

  // Auxiliary Services
  services: {
    dni: async (dni: string) => {
      return request<{ status: string; data: any }>(`/services/dni/${dni}`);
    },
    ruc: async (ruc: string) => {
      return request<{ status: string; data: any }>(`/services/ruc/${ruc}`);
    },
    exchangeRate: async (
      params?: string | { date?: string; source?: "sunat" | "sbs" },
    ) => {
      const query = new URLSearchParams();
      if (typeof params === "string") {
        query.append("date", params);
      } else if (params) {
        if (params.date) query.append("date", params.date);
        if (params.source) query.append("source", params.source);
      }
      return request<{
        status: string;
        data: {
          date: string;
          source: "SUNAT" | "SBS" | string;
          currency: string;
          compra: number;
          venta: number;
        };
      }>(
        `/services/exchange-rate${query.toString() ? `?${query.toString()}` : ""}`,
      );
    },
  },

  // API Keys (For external POS/ERP integrations - Permanent & Scoped)
  apiKeys: {
    getAll: async (params?: {
      user_id?: number;
      search?: string;
    }): Promise<ApiKey[]> => {
      const query = new URLSearchParams();
      if (params?.user_id) query.append("user_id", params.user_id.toString());
      if (params?.search) query.append("search", params.search);

      const res = await request<{ status: string; data: ApiKey[] }>(
        `/api-keys${query.toString() ? `?${query.toString()}` : ""}`,
      );
      return res.data;
    },
    create: async (payload: {
      name: string;
      user_id?: number;
    }): Promise<ApiKey> => {
      const res = await request<{
        status: string;
        message: string;
        data: ApiKey;
      }>("/api-keys", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    update: async (
      id: number,
      payload: { name?: string; is_active?: boolean },
    ): Promise<ApiKey> => {
      const res = await request<{ status: string; data: ApiKey }>(
        `/api-keys/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      return res.data;
    },
    regenerate: async (id: number): Promise<ApiKey> => {
      const res = await request<{ status: string; data: ApiKey }>(
        `/api-keys/${id}/regenerate`,
        {
          method: "POST",
        },
      );
      return res.data;
    },
    delete: async (id: number): Promise<void> => {
      await request(`/api-keys/${id}`, {
        method: "DELETE",
      });
    },
  },
};
