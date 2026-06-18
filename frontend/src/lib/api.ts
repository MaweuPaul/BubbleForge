// Centralized API base URL — set in .env.local
// Backend registers all routes under /api/v1
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081';
export const API_URL = `${BASE}/api/v1`;
