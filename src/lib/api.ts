import i18n from "@/i18n";

export interface ApiUser {
  id: string;
  email: string;
  role: "user" | "provider" | "admin";
  name: string;
  city: string;
  phone: string | null;
}

export interface AdminUserInput {
  email: string;
  name: string;
  city: string;
  phone: string | null;
  role: ApiUser["role"];
  password?: string;
}

export interface ApiService {
  id: string;
  provider_id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  phone: string | null;
  price_range: string | null;
  created_at: string;
  profiles: { name: string; email?: string; phone?: string | null; city?: string } | null;
  avg_rating: number;
  review_count: number;
  tags: string[];
}

function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.replace(/\/$/, "");
  if (trimmed.startsWith("/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    return url.pathname === "/" ? `${trimmed}/api` : trimmed;
  }
  return `https://${trimmed}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || "/api");
const TOKEN_KEY = "localfind_access_token";
const apiErrorKeys: Record<string, string> = {
  "Incorrect email or password": "incorrectCredentials",
  "Email address is required.": "emailRequired",
  "Please enter a valid email address.": "invalidEmail",
  "Password must be at least 6 characters long.": "passwordTooShort",
  "Password cannot exceed 128 characters.": "passwordTooLong",
  "Please select a valid account type.": "invalidRole",
  "The request contains an unsupported field.": "unsupportedField",
  "An account with this email already exists": "accountExists",
  "Account not found": "accountNotFound",
  "Service not found": "serviceNotFound",
  "Gallery item not found": "galleryItemNotFound",
  "Insufficient permissions": "insufficientPermissions",
  "Authentication required": "authenticationRequired",
  "Only service providers can add services": "providerOnly",
  "Only the service provider can manage this gallery": "providerGalleryOnly",
  "Only customer accounts can leave reviews": "customerOnlyReview",
  "Email address cannot be empty": "emailCannotBeEmpty",
  "Account type cannot be empty": "roleCannotBeEmpty",
  "You cannot change your own admin role": "cannotChangeOwnRole",
  "You cannot remove your own admin account": "cannotDeleteSelf",
  "Remove this provider's service listings before changing their account type": "deleteProviderListingsFirst",
  "Service provider phone numbers cannot be changed": "phoneProviderImmutable",
  "A customer phone number can only be set once": "customerPhoneSetOnce",
  "Unsupported gallery file type": "unsupportedFile",
  "The uploaded file is empty": "emptyFile",
  "Files must be 10 MB or smaller": "fileTooLarge",
  "Not found": "notFound",
};

function localizeApiError(message: string, status: number): string {
  const key = apiErrorKeys[message];
  if (key) return i18n.t(`errors.api.${key}`);

  if (message.includes("Please check the ") || (status === 422 && i18n.language.startsWith("hi"))) {
    return i18n.t("errors.api.checkInput");
  }

  const requiredField = message.match(/^(.+) is required\.$/);
  if (requiredField) {
    const fieldKeys: Record<string, string> = {
      "Name": "nameRequired",
      "City": "cityRequired",
      "Phone number": "phoneRequired",
      "Rating": "ratingRequired",
      "Comment": "commentRequired",
      "Service title": "titleRequired",
      "Service category": "categoryRequired",
      "Message": "messageRequired",
    };
    const requiredKey = fieldKeys[requiredField[1]];
    if (requiredKey) return i18n.t(`errors.api.${requiredKey}`);
  }

  return message;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function apiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const apiOrigin = API_BASE_URL.startsWith("http")
    ? new URL(API_BASE_URL).origin
    : window.location.origin;
  return new URL(path, apiOrigin).toString();
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json() as { detail?: string | unknown[] };
      if (typeof body.detail === "string") message = body.detail;
      else if (body.detail) message = JSON.stringify(body.detail);
    } catch {
      message = response.statusText || message;
    }
    throw new Error(localizeApiError(message, response.status));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export { API_BASE_URL };
