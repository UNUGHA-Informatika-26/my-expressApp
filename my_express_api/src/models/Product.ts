import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/** Status stok dihitung, tidak disimpan (lihat 03-database.md). */
export type StockStatus = 'aman' | 'menipis' | 'habis';

/**
 * Hitung status stok dari jumlah stok dan batas minimum.
 * habis   = stock 0
 * menipis = stock > 0 dan stock <= min_stock
 * aman    = selain itu
 */
export function computeStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return 'habis';
  if (stock <= minStock) return 'menipis';
  return 'aman';
}

/** Bentuk data produk sesuai skema tabel `products`. */
export interface ProductAttributes {
  id: string;
  userId: string;
  barcode: string;
  name: string;
  category: string;
  satuan: string;
  price: number;
  stock: number;
  minStock: number;
}

/** Kolom yang boleh diisi saat membuat produk baru (id dan userId diisi sistem). */
type ProductCreationAttributes = Optional<ProductAttributes, 'id' | 'userId'>;

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  declare id: string;
  declare userId: string;
  declare barcode: string;
  declare name: string;
  declare category: string;
  declare satuan: string;
  declare price: number;
  declare stock: number;
  declare minStock: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Product.init(
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
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    // Satuan pengukuran stok (pcs, rim, lembar, ...). Nilai lama yang belum
    // mengisi kolom ini dibalik sebagai 'pcs' lewat ALTER TABLE di database.
    satuan: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pcs',
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'min_stock',
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    underscored: true,
    // Barcode unik per pemilik toko, bukan global.
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'barcode'],
      },
    ],
  },
);
