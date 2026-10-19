import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Distributor } from './Distributor';

/** Status hutang sesuai 03-database.md: belum_lunas (default) atau lunas. */
export type DebtStatus = 'belum_lunas' | 'lunas';

/**
 * Bentuk data hutang sesuai skema tabel `debts`.
 *
 * `sisa` (sisa hutang), `isOverdue` (lewat tempo), dan `isDueSoon`
 * (jatuh tempo dalam 7 hari) adalah nilai **dihitung, tidak disimpan**
 * (03-database.md baris 92).
 */
export interface DebtAttributes {
  id: string;
  userId: string;
  distributorId: string;
  invoiceNumber: string;
  /** Total hutang, > 0. */
  totalAmount: number;
  /** Sudah dibayar, default 0. */
  paidAmount: number;
  /** Jatuh tempo; DATEONLY sehingga nilainya `YYYY-MM-DD` tanpa jam. */
  dueDate: string;
  status: DebtStatus;
}

/** Kolom yang boleh diisi saat membuat hutang (id, userId, paidAmount diisi sistem). */
type DebtCreationAttributes = Optional<
  DebtAttributes,
  'id' | 'userId' | 'paidAmount' | 'status'
>;

export class Debt extends Model<DebtAttributes, DebtCreationAttributes> implements DebtAttributes {
  declare id: string;
  declare userId: string;
  declare distributorId: string;
  declare invoiceNumber: string;
  declare totalAmount: number;
  declare paidAmount: number;
  declare dueDate: string;
  declare status: DebtStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  /**
   * Terisi bila query memakai `include: Distributor`.
   * Dideklarasikan di sini (bukan di DebtPayment) untuk menghindari impor bundar.
   */
  declare readonly distributor?: Distributor | null;
}

Debt.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    distributorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'distributor_id',
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'invoice_number',
    },
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_amount',
    },
    paidAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'paid_amount',
    },
    dueDate: {
      // DATEONLY dipetakan ke kolom DATE PostgreSQL dan dibaca sebagai
      // string YYYY-MM-DD, jadi perbandingan tanggal tidak terpengaruh jam.
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'due_date',
    },
    status: {
      type: DataTypes.ENUM('belum_lunas', 'lunas'),
      allowNull: false,
      defaultValue: 'belum_lunas',
    },
  },
  {
    sequelize,
    modelName: 'Debt',
    tableName: 'debts',
    underscored: true,
  },
);

// Relasi sesuai 03-database.md: satu distributor punya banyak hutang.
Distributor.hasMany(Debt, { foreignKey: 'distributor_id', as: 'debts' });
Debt.belongsTo(Distributor, { foreignKey: 'distributor_id', as: 'distributor' });
