import { api } from '../../lib/api';
import type { DashboardResponse, DashboardSummary } from '../../types/api';

/** GET /api/dashboard — ringkasan satu layar beranda. */
export async function getDashboard(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardResponse>('/api/dashboard');
  return data.data;
}
