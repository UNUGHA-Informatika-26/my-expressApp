import type { User } from '../models/User';

/** Data user yang aman dikirim ke klien (tanpa password_hash). */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  storeName: string | null;
  phone: string | null;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    storeName: user.storeName,
    phone: user.phone,
  };
}
