import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/** Bentuk data distributor sesuai skema tabel `distributors`. */
export interface DistributorAttributes {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
}

/** Kolom yang boleh diisi saat membuat distributor (id dan userId diisi sistem). */
type DistributorCreationAttributes = Optional<DistributorAttributes, 'id' | 'userId' | 'phone'>;

export class Distributor
  extends Model<DistributorAttributes, DistributorCreationAttributes>
  implements DistributorAttributes
{
  declare id: string;
  declare userId: string;
  declare name: string;
  declare phone: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Distributor.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Distributor',
    tableName: 'distributors',
    underscored: true,
  },
);
