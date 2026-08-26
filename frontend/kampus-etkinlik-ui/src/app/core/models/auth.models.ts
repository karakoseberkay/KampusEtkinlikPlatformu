export interface LoginRequest { // giriş yaparken backende gönderilecek verileri tutar
  email: string; // giriş yapacak kullanıcının mail adresini gönderir
  password: string; // kullanıcının şifresini gönderir
}

export interface RegisterRequest { // kayıt olurken backende gönderilecek verileri tutar
  fullName: string; // kayıt olacak kullanıcının ad soyad bilgisini gönderir
  email: string; // kullanıcının mail adresini gönderir
  password: string; // kullanıcının oluşturacağı şifreyi gönderir
  department: string | null; // kullanıcının bölüm bilgisini gönderir bölüm girilmediyse null olabilir
}

export interface AuthResponse { // login veya register işleminden backendden dönen kullanıcı ve token bilgilerini tutar
  userId: string; // giriş yapan veya kayıt olan kullanıcının idsini tutar
  fullName: string; // kullanıcının ad soyad bilgisini tutar
  email: string; // kullanıcının mail adresini tutar
  roles: string[]; // kullanıcının sahip olduğu rolleri liste halinde tutar
  accessToken: string; // backendin oluşturduğu jwt tokenı tutar sonraki isteklerde kullanıcıyı doğrulamak için kullanılır
  expiresAtUtc: string; // tokenın utcye göre ne zaman geçersiz olacağını tutar
}