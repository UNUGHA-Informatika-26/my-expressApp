import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Transaction } from './Transaction';
import { Product } from './Product';

/**
 * Bentuk data item transaksi sesuai skema tabel `transaction_items`.
 * `productName`, `satuan`, dan `price` adalah salinan saat transaksi, supaya
 * riwayat tidak ikut berubah ketika produk diedit atau dihapus
 * (lihat 03-database.md).
 */
export interface TransactionItemAttributes {
  id: string;
  transactionId: string;
  /** Null jika produknya sudah dihapus (ON DELETE SET NULL). */
  productId: string | null;
  productName: string;
  satuan: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/** Kolom yang boleh diisi saat membuat item (id dan transactionId diisi sistem). */
type TransactionItemCreationAttributes = Optional<
  TransactionItemAttributes,
  'id' | 'transactionId'
>;

export class TransactionItem
  extends Model<TransactionItemAttributes, TransactionItemCreationAttributes>
  implements TransactionItemAttributes
{
  declare id: string;
  declare transactionId: string;
  declare productId: string | null;
  declare productName: string;
  declare satuan: string;
  declare price: number;
  declare quantity: number;
  declare subtotal: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TransactionItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'transaction_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'product_id',
    },
    productName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'product_name',
    },
    // Salinan satuan produk saat transaksi. Data lama yang belum memilikinya
    // diisi 'pcs' lewat ALTER TABLE, sama seperti tabel products.
    satuan: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pcs',
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'TransactionItem',
    tableName: 'transaction_items',
    underscored: true,
  },
);

// Relasi sesuai 03-database.md:
// - transaction_id → transactions, ON DELETE CASCADE (item ikut terhapus)
// - product_id → products, ON DELETE SET NULL (riwayat tetap ada walau produk dihapus)
Transaction.hasMany(TransactionItem, {
  foreignKey: 'transaction_id',
  as: 'items',
  onDelete: 'CASCADE',
});
TransactionItem.belongsTo(Transaction, {
  foreignKey: 'transaction_id',
  as: 'transaction',
  onDelete: 'CASCADE',
});
TransactionItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  onDelete: 'SET NULL',
});
