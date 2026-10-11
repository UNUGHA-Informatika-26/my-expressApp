import { api } from '../../lib/api';
import type { AuthResponse, ProfileResponse, User } from '../../types/api';
import type { LoginValues, RegisterValues, UpdateProfileValues } from './validation';

/** POST /api/auth/register */
export async function register(input: RegisterValues): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', input);
  return data;
}

/** POST /api/auth/login */
export async function login(input: LoginValues): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', input);
  return data;
}

/** GET /api/profile */
export async function getProfile(): Promise<User> {
  const { data } = await api.get<ProfileResponse>('/api/profile');
  return data.data;
}

/** PUT /api/profile */
export async function updateProfile(input: UpdateProfileValues): Promise<User> {
  const { data } = await api.put<ProfileResponse>('/api/profile', input);
  return data.data;
}
