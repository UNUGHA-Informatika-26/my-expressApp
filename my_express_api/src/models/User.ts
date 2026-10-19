import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/** Bentuk data user sesuai skema tabel `users`. */
export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  storeName: string | null;
  phone: string | null;
}

/** Kolom yang boleh diisi saat membuat user baru. */
type UserCreationAttributes = Optional<UserAttributes, 'id' | 'storeName' | 'phone'>;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare storeName: string | null;
  declare phone: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      // PK dibuat database memakai gen_random_uuid(), sesuai 03-database.md.
      defaultValue: sequelize.literal('gen_random_uuid()'),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    storeName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'store_name',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    // Nama kolom di database memakai snake_case (created_at, updated_at).
    underscored: true,
    // Kata sandi tidak boleh pernah ikut dalam query bawaan.
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
    scopes: {
      // Hanya dipakai halaman login untuk membandingkan kata sandi.
      withPassword: {
        attributes: { include: ['passwordHash'] },
      },
    },
  },
);
