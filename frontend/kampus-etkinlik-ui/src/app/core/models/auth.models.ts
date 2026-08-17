export interface LoginRequest { // giriş yaparken backende gönderilecek verileri tutar
  email: string;
  password: string;
}

export interface RegisterRequest { // kayıt olurken backende gönderilecek verileri tutar
  fullName: string;
  email: string;
  password: string;
  department: string | null;
}

export interface AuthResponse { // login veya register işleminden backendden dönen kullanıcı ve token bilgilerini tutar
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
  accessToken: string;
  expiresAtUtc: string;
}