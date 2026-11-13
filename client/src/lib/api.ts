import axios from "axios";

const baseURL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
