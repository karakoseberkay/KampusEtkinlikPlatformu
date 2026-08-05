export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  department: string;
}

export interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
  accessToken: string;
  expiresAtUtc: string;
}
