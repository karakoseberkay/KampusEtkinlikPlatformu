import { isPlatformBrowser } from '@angular/common';//gerçekten tarayıcıda mı çalışıyor çünkü localstorage sadece tarayıcı ortamında var
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { AuthResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'//bu servis uygulama genelinde tek dosya olduğu belirtiliyor yani bunun yardımcısı ya da eki yok demek
})
export class AuthStorageService {
  private readonly platformId = inject(PLATFORM_ID); // kodun tarayıcıda mı çalıştığını kontrol etmek için kullanılır
  private readonly storageKey = 'kampus_etkinlik_auth'; // kullanıcı oturumunun localStorageda tutulacağı keyi belirler

  save(session: AuthResponse): void { // kullanıcı oturumunu localStoragea kaydeder
    if (!isPlatformBrowser(this.platformId)) {//önlem
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(session)); // session bilgisini (stringi) jsona (objeye) çevirerek kaydeder
  }

  getValidSession(): AuthResponse | null { // kayıtlı oturumun geçerli olup olmadığını kontrol eder
    const session = this.read();

    if (session === null) {//önlem
      return null;
    }

    const expirationTime = new Date(session.expiresAtUtc).getTime(); // tokenın bitiş zamanını milisaniyeye çevirir
    const isExpired = Number.isNaN(expirationTime) || expirationTime <= Date.now(); // tokenın süresi dolmuş mu kontrol eder

    if (isExpired) {//önlem
      this.clear();//localstorage temizlenir
      return null;
    }

    return session;
  }

  getAccessToken(): string | null { // geçerli oturum varsa JWT tokenı döndürür
    return this.getValidSession()?.accessToken ?? null;
  }

  clear(): void { // localStoragedaki kullanıcı oturumunu siler
    if (!isPlatformBrowser(this.platformId)) {//önlem
      return;
    }

    localStorage.removeItem(this.storageKey);
  }

  private read(): AuthResponse | null { // localStoragedaki kullanıcı oturumunu okuyup kontrol eder
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const storedValue = localStorage.getItem(this.storageKey);

    if (!storedValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(storedValue) as AuthResponse; // json olarak tutulan session bilgisini tekrar objeye çevirir

      const isValid =
        typeof parsedValue.userId === 'string' &&
        typeof parsedValue.fullName === 'string' &&
        typeof parsedValue.email === 'string' &&
        Array.isArray(parsedValue.roles) &&
        typeof parsedValue.accessToken === 'string' &&
        typeof parsedValue.expiresAtUtc === 'string'; // localStoragedan gelen verinin beklediğimiz yapıda olup olmadığını kontrol eder

      if (!isValid) {
        this.clear();
        return null;
      }

      return parsedValue;
    } catch {
      this.clear(); // json bozuksa sessionı temizler
      return null;
    }
  }
}