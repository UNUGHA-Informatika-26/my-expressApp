import { api } from '../../lib/api';
import type { NotificationListResponse } from '../../types/api';

/**
 * GET /api/notifications — peringatan stok dan hutang (04-api.md bagian 6).
 * `count` dipakai sebagai angka di ikon lonceng.
 */
export async function listNotifications(): Promise<NotificationListResponse['data']> {
  const { data } = await api.get<NotificationListResponse>('/api/notifications');
  return data.data;
}
