import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Debt, DebtStatus, Distributor, PayDebtResponse } from '../../types/api';
import { createDebt, createDistributor, getDebt, listDebts, listDistributors, payDebt } from './api';
import type { CreateDebtPayload, CreateDistributorPayload, PayDebtPayload } from './validation';

/**
 * Kunci query fitur hutang.
 * Semua mutasi memakai kunci-kunci ini saat invalidateQueries, supaya
 * daftar, detail, dan ringkasan beranda ikut diperbarui.
 */
export const debtKeys = {
  distributors: ['distributors'] as const,
  debts: ['debts'] as const,
  debt: (id: string) => ['debt', id] as const,
};

/** Daftar distributor untuk dipilih pada form tambah hutang. */
export function useDistributors() {
  return useQuery({
    queryKey: debtKeys.distributors,
    queryFn: listDistributors,
  });
}

/**
 * Daftar hutang beserta ringkasan seluruh hutang berjalan.
 * Data server dikelola TanStack Query, bukan Zustand (AGENTS.md).
 */
export function useDebts(status?: DebtStatus | null) {
  return useQuery({
    queryKey: [...debtKeys.debts, status ?? 'semua'] as const,
    queryFn: () => listDebts(status),
  });
}

/** Detail satu hutang beserta riwayat pembayarannya. */
export function useDebt(id: string) {
  return useQuery({
    queryKey: debtKeys.debt(id),
    queryFn: () => getDebt(id),
    enabled: id.length > 0,
  });
}

/** Simpan distributor baru lalu muat ulang daftar pilihan. */
export function useCreateDistributor() {
  const queryClient = useQueryClient();

  return useMutation<Distributor, unknown, CreateDistributorPayload>({
    mutationFn: createDistributor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: debtKeys.distributors });
    },
  });
}

/**
 * Simpan hutang baru.
 *
 * Setelah sukses, daftar hutang dan ringkasan beranda diambil ulang karena
 * total hutang berjalan dan peringatan jatuh tempo ikut berubah.
 */
export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation<Debt, unknown, CreateDebtPayload>({
    mutationFn: createDebt,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: debtKeys.debts });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Catat pembayaran hutang.
 *
 * Setelah sukses, daftar hutang, detail hutang tersebut, dan ringkasan
 * beranda diambil ulang karena sisa hutang dan statusnya berubah.
 */
export function usePayDebt(id: string) {
  const queryClient = useQueryClient();

  return useMutation<PayDebtResponse['data'], unknown, PayDebtPayload>({
    mutationFn: (payload: PayDebtPayload) => payDebt(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: debtKeys.debts });
      await queryClient.invalidateQueries({ queryKey: debtKeys.debt(id) });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
