import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Debt } from './Debt';

/**
 * Bentuk data pembayaran hutang sesuai skema tabel `debt_payments`.
 * `amount` harus > 0 dan tidak boleh melebihi sisa hutang (03-database.md).
 */
export interface DebtPaymentAttributes {
  id: string;
  debtId: string;
  amount: number;
  paidAt: Date;
  note: string | null;
}

/** Kolom yang boleh diisi saat mencatat pembayaran (id dan paidAt diisi sistem). */
type DebtPaymentCreationAttributes = Optional<
  DebtPaymentAttributes,
  'id' | 'paidAt' | 'note'
>;

export class DebtPayment
  extends Model<DebtPaymentAttributes, DebtPaymentCreationAttributes>
  implements DebtPaymentAttributes
{
  declare id: string;
  declare debtId: string;
  declare amount: number;
  declare paidAt: Date;
  declare note: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DebtPayment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    debtId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'debt_id',
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'paid_at',
    },
    note: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'DebtPayment',
    tableName: 'debt_payments',
    underscored: true,
  },
);

// Relasi sesuai 03-database.md: pembayaran ikut terhapus bila hutangnya dihapus
// (ON DELETE CASCADE), dan satu hutang punya banyak pembayaran.
Debt.hasMany(DebtPayment, { foreignKey: 'debt_id', as: 'payments', onDelete: 'CASCADE' });
DebtPayment.belongsTo(Debt, { foreignKey: 'debt_id', as: 'debt', onDelete: 'CASCADE' });
