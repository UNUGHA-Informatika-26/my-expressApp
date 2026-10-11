import { api } from '../../lib/api';
import type {
  Debt,
  DebtDetail,
  DebtDetailResponse,
  DebtListResponse,
  DebtStatus,
  Distributor,
  DistributorListResponse,
  PayDebtResponse,
} from '../../types/api';
import type {
  CreateDebtPayload,
  CreateDistributorPayload,
  PayDebtPayload,
} from './validation';

/** GET /api/distributors — daftar distributor milik pemilik toko. */
export async function listDistributors(): Promise<Distributor[]> {
  const { data } = await api.get<DistributorListResponse>('/api/distributors');
  return data.data;
}

/** POST /api/distributors — tambah distributor baru. */
export async function createDistributor(payload: CreateDistributorPayload): Promise<Distributor> {
  const { data } = await api.post<{ data: Distributor }>('/api/distributors', payload);
  return data.data;
}

/**
 * GET /api/debts — daftar hutang beserta ringkasan seluruh hutang berjalan.
 * `status` null berarti tampilkan semua (04-api.md).
 */
export async function listDebts(status?: DebtStatus | null): Promise<DebtListResponse['data']> {
  const { data } = await api.get<DebtListResponse>('/api/debts', {
    params: { status: status || undefined },
  });
  return data.data;
}

/** GET /api/debts/:id — detail satu hutang dan riwayat pembayarannya. */
export async function getDebt(id: string): Promise<DebtDetail> {
  const { data } = await api.get<DebtDetailResponse>(`/api/debts/${id}`);
  return data.data;
}

/** POST /api/debts — catat hutang baru ke distributor. */
export async function createDebt(payload: CreateDebtPayload): Promise<Debt> {
  const { data } = await api.post<{ data: Debt }>('/api/debts', payload);
  return data.data;
}

/** POST /api/debts/:id/payments — catat pembayaran hutang. */
export async function payDebt(id: string, payload: PayDebtPayload): Promise<PayDebtResponse['data']> {
  const { data } = await api.post<PayDebtResponse>(`/api/debts/${id}/payments`, payload);
  return data.data;
}
