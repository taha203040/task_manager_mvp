import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1", // بسبب إعداد rewrites في next.config
  headers: { "Content-Type": "application/json" },
  withCredentials: true
});
