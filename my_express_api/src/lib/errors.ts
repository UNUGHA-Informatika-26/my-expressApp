/**
 * Error yang dipakai controller my_express_api.
 * Keduanya ditangkap di dalam controller masing-masing sehingga dibalas
 * dengan kode yang benar, bukan jatuh ke error handler 500.
 */

/** Pelanggaran aturan bisnis (stok kurang, uang kurang, bayar melebihi sisa). Dibalas 422. */
export class BusinessRuleError extends Error {
  constructor(
    readonly message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

/** Data tidak ditemukan atau bukan milik pemilik toko. Dibalas 404. */
export class NotFoundError extends Error {
  constructor(message = 'Data tidak ditemukan') {
    super(message);
    this.name = 'NotFoundError';
  }
}
