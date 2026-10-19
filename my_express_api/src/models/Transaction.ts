import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/** Metode bayar yang didukung (lihat 04-api.md). */
export type PaymentMethod = 'tunai' | 'qris' | 'transfer';

/** Bentuk data transaksi sesuai skema tabel `transactions`. */
export interface TransactionAttributes {
  id: string;
  userId: string;
  /** Nomor transaksi `TRX-YYYYMMDD-0001`, urut per hari. */
  code: string;
  paymentMethod: PaymentMethod;
  total: number;
  /** Uang diterima; hanya untuk tunai, selain itu null. */
  amountReceived: number | null;
  /** Kembalian; hanya untuk tunai, selain itu null. */
  changeAmount: number | null;
}

/** Kolom yang boleh diisi saat membuat transaksi (id, userId, code dihitung sistem). */
type TransactionCreationAttributes = Optional<
  TransactionAttributes,
  'id' | 'userId' | 'code' | 'amountReceived' | 'changeAmount'
>;

export class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare id: string;
  declare userId: string;
  declare code: string;
  declare paymentMethod: PaymentMethod;
  declare total: number;
  declare amountReceived: number | null;
  declare changeAmount: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Transaction.init(
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
    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('tunai', 'qris', 'transfer'),
      allowNull: false,
      field: 'payment_method',
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amountReceived: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'amount_received',
    },
    changeAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'change_amount',
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true,
    // Nomor transaksi unik per pemilik toko, bukan global.
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'code'],
      },
    ],
  },
);
