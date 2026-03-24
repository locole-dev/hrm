import axios, { AxiosError } from "axios";

import { mockDownload, mockRequest } from "@/mock/mock-server";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./storage";
import type { ApiEnvelope, AuthResponse } from "@/types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const http = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise: Promise<string | null> | null = null;

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<{ message?: string }>>) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      (originalRequest as AxiosError["config"] & { _retry?: boolean })._retry
    ) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = refreshSession();
    }

    const nextToken = await refreshPromise;
    refreshPromise = null;

    if (!nextToken) {
      clearTokens();
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${nextToken}`;
    (originalRequest as AxiosError["config"] & { _retry?: boolean })._retry = true;

    return http(originalRequest);
  },
);

async function refreshSession() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post<ApiEnvelope<AuthResponse>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );

    setTokens(response.data.data);
    return response.data.data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  if (USE_MOCK) {
    return mockRequest<T>("GET", url, undefined, params);
  }
  const response = await http.get<ApiEnvelope<T>>(url, { params });
  return response.data.data;
}

export async function apiPost<T>(url: string, data?: unknown) {
  if (USE_MOCK) {
    return mockRequest<T>("POST", url, data);
  }
  const response = await http.post<ApiEnvelope<T>>(url, data);
  return response.data.data;
}

export async function apiPatch<T>(url: string, data?: unknown) {
  if (USE_MOCK) {
    return mockRequest<T>("PATCH", url, data);
  }
  const response = await http.patch<ApiEnvelope<T>>(url, data);
  return response.data.data;
}

export async function apiDelete<T>(url: string, data?: unknown) {
  if (USE_MOCK) {
    return mockRequest<T>("DELETE", url, data);
  }
  const response = await http.delete<ApiEnvelope<T>>(url, { data });
  return response.data.data;
}

export async function apiDownload(url: string, params?: Record<string, unknown>) {
  if (USE_MOCK) {
    return mockDownload(url);
  }
  const response = await http.get<Blob>(url, {
    params,
    responseType: "blob",
  });

  return response.data;
}

export { API_BASE_URL, USE_MOCK };
