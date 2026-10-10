import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ERROR_MESSAGES } from '@phonologic/shared-types';
import type { AuthResult, ErrorCode } from '@phonologic/shared-types';
import i18n from './i18n';
import { fieldMessageKeys } from './server-messages';

const AUTH_KEY = 'phonologic.auth';
export class ApiError extends Error {
  constructor(
    messageKey: string,
    public readonly status: number,
    private readonly fieldKeys: Record<string, string> = {},
    values: Record<string, string | number> = {},
  ) {
    super(messageKey);
    this.name = 'ApiError';
    // Keep the error object valid when the interface language changes.
    Object.defineProperty(this, 'message', { configurable: true, get: () => i18n.t(messageKey, values) });
  }
  get fields(): Record<string, string> {
    return Object.fromEntries(Object.entries(this.fieldKeys).map(([path, key]) => [path, i18n.t(key)]));
  }
}
export function getStoredAuth(): AuthResult | null {
  try {
    const value = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    return value?.accessToken && value?.refreshToken && value?.user?.id ? value : null;
  } catch { return null; }
}
export function saveAuth(auth: AuthResult) { localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); }
export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('phonologic:logout'));
}

export const http = axios.create({ baseURL: '/api' });
// A separate client avoids recursively intercepting the refresh request.
const refreshHttp = axios.create({ baseURL: '/api' });
let refreshPromise: Promise<AuthResult> | null = null;
type RetryConfig = InternalAxiosRequestConfig & { authRetried?: boolean };
const tokenErrorCodes = new Set(['AUTH_ACCESS_TOKEN_MISSING', 'AUTH_ACCESS_TOKEN_INVALID', 'AUTH_SESSION_EXPIRED']);
function normalizeError(error: unknown): Error {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error : new Error('Yêu cầu thất bại');
  const data = error.response?.data;
  const fields: Record<string, string> = {};
  for (const issue of Array.isArray(data?.errors) ? data.errors : []) {
    if (issue.path) fields[issue.path] = issue.message || fieldMessageKeys[issue.code] || data.message || 'Dữ liệu không hợp lệ';
  }
  const message = data?.message && i18n.exists(data.message, { lng: 'en' }) ? data.message : ERROR_MESSAGES[data?.code as ErrorCode];
  return new ApiError(message || (error.response ? 'Yêu cầu thất bại ({{status}})' : 'Không kết nối được máy chủ. Kiểm tra kết nối và thử lại.'), error.response?.status || 0, fields, { status: error.response?.status || 0 });
}
async function refreshAccess(): Promise<AuthResult> {
  const before = getStoredAuth();
  if (!before) throw new ApiError('Phiên đăng nhập đã hết hiệu lực.', 401);
  try {
    const { data } = await refreshHttp.post<AuthResult>('/auth/refresh', { refreshToken: before.refreshToken });
    // A sign-out or another sign-in while refreshing must not restore the old account.
    if (getStoredAuth()?.refreshToken !== before.refreshToken) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401);
    saveAuth(data);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status || 0) && getStoredAuth()?.refreshToken === before.refreshToken) clearAuth();
    throw normalizeError(error);
  }
}
http.interceptors.request.use(config => {
  const auth = getStoredAuth();
  if (auth) config.headers.set('Authorization', `Bearer ${auth.accessToken}`);
  else config.headers.delete('Authorization');
  const lang = i18n.language || 'vi';
  config.headers.set('Accept-Language', lang);
  config.headers.set('X-Lang', lang);
  return config;
});
refreshHttp.interceptors.request.use(config => {
  const lang = i18n.language || 'vi';
  config.headers.set('Accept-Language', lang);
  config.headers.set('X-Lang', lang);
  return config;
});
http.interceptors.response.use(response => response, async (error: AxiosError<{ code?: string }>) => {
  const config = error.config as RetryConfig | undefined;
  const auth = getStoredAuth();
  const publicAuth = /\/auth\/(login|register|refresh)$/.test(config?.url || '');
  const tokenFailure = error.response?.status === 401 && tokenErrorCodes.has(error.response.data?.code || '');
  if (!config || !auth || publicAuth || !tokenFailure) return Promise.reject(normalizeError(error));
  if (config.authRetried) {
    if (config.headers.get('Authorization') === `Bearer ${auth.accessToken}`) clearAuth();
    return Promise.reject(normalizeError(error));
  }
  config.authRetried = true;
  try {
    // A late 401 may belong to the old access token after another request refreshed it.
    if (config.headers.get('Authorization') === `Bearer ${auth.accessToken}`) {
      if (!refreshPromise) refreshPromise = refreshAccess().finally(() => { refreshPromise = null; });
      await refreshPromise;
    }
    if (!getStoredAuth() || getStoredAuth()?.user.id !== auth.user.id) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401);
    return await http.request(config);
  } catch (refreshError) { return Promise.reject(normalizeError(refreshError)); }
});

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = Object.fromEntries(new Headers(options.headers).entries());
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const { data } = await http.request<T>({ url: path, method: options.method || 'GET', data: options.body, headers, signal: options.signal || undefined });
  return data;
}
export async function apiBlob(path: string): Promise<Blob> {
  const { data } = await http.get<Blob>(path, { responseType: 'blob' });
  return data;
}
