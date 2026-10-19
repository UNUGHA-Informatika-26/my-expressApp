import { Debt, type DebtStatus } from '../models/Debt';

/** Batas "segera jatuh tempo" dalam hari (03-database.md baris 92). */
export const DUE_SOON_DAYS = 7;

/** Nilai yang dihitung dari satu hutang, bukan kolom tersimpan. */
export interface DebtFlags {
  /** Dihitung: total_amount - paid_amount. */
  remaining: number;
  /** Dihitung: belum_lunas dan due_date sebelum hari ini (WIB). */
  isOverdue: boolean;
  /** Dihitung: belum_lunas dan due_date hari ini sampai +7 hari. */
  isDueSoon: boolean;
}

/** Satu hutang untuk respons API. */
export interface DebtView extends DebtFlags {
  id: string;
  distributorId: string;
  distributorName: string | null;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: DebtStatus;
}

/**
 * Hitung sisa hutang, lewat tempo, dan segera jatuh tempo (03-database.md baris 92).
 *
 * Pembanding memakai string `YYYY-MM-DD`, jadi urutannya benar tanpa perlu
 * mengubah tipe DATEONLY. `dueDate === today` dianggap belum lewat tempo
 * tetapi sudah masuk jendela "segera jatuh tempo".
 */
export function computeDebtFlags(
  debt: Pick<Debt, 'totalAmount' | 'paidAmount' | 'status' | 'dueDate'>,
  today: string,
  dueSoonLimit: string,
): DebtFlags {
  const open = debt.status === 'belum_lunas';
  return {
    remaining: debt.totalAmount - debt.paidAmount,
    isOverdue: open && debt.dueDate < today,
    isDueSoon: open && debt.dueDate >= today && debt.dueDate <= dueSoonLimit,
  };
}

/** Bentuk lengkap satu hutang untuk respons API. */
export function toDebtView(
  debt: Pick<Debt, 'id' | 'distributorId' | 'invoiceNumber' | 'totalAmount' | 'paidAmount' | 'dueDate' | 'status'> & {
    distributor?: { name: string } | null;
  },
  today: string,
  dueSoonLimit: string,
): DebtView {
  return {
    id: debt.id,
    distributorId: debt.distributorId,
    distributorName: debt.distributor?.name ?? null,
    invoiceNumber: debt.invoiceNumber,
    totalAmount: debt.totalAmount,
    paidAmount: debt.paidAmount,
    dueDate: debt.dueDate,
    status: debt.status,
    ...computeDebtFlags(debt, today, dueSoonLimit),
  };
}
