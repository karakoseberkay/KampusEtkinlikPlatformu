import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.models';
import { AuthStorageService } from './auth-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient); // backende http istekleri göndermemizi sağlar
  private readonly router = inject(Router); // kullanıcıyı farklı routelara yönlendirmemizi sağlar(logout to login)
  private readonly authStorage = inject(AuthStorageService); // kullanıcı oturumunu localStorageda yönetmemizi sağlar

  private readonly currentUserSignal = signal<AuthResponse | null>(
    this.authStorage.getValidSession()
  ); // giriş yapan kullanıcının bilgilerini signal olarak tutar

  readonly currentUser = this.currentUserSignal.asReadonly(); // kullanıcı bilgisinin dışarıdan sadece okunmasını sağlar

  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
    
   // kullanıcının giriş yapıp yapmadığını kontrol eder

  readonly roles = computed(() => this.currentUserSignal()?.roles ?? []);
    
   // giriş yapan kullanıcının rollerini tutar kullanıcı yoksa boş dizi tutar

  login(request: LoginRequest): Observable<AuthResponse> { // kullanıcı giriş isteğini backende gönderir
    return this.http.post<AuthResponse>(`${API_BASE_URL}/Auth/login`, request)
      .pipe(tap(response => this.setSession(response)));
         // başarılı girişten dönen kullanıcı ve token bilgilerini kaydeder
      
  }

  register(request: RegisterRequest): Observable<AuthResponse> { // kullanıcı kayıt isteğini backende gönderir
    return this.http.post<AuthResponse>(`${API_BASE_URL}/Auth/register`, request)
      .pipe(tap(response => this.setSession(response)));
         // başarılı kayıttan sonra oturumu kaydeder
      
  }

  getMe(): Observable<AuthResponse> { // giriş yapan kullanıcının güncel bilgilerini backendden alır
    return this.http.get<AuthResponse>(`${API_BASE_URL}/Auth/me`)
      .pipe(tap(response => this.setSession(response)));
        
      
  }

  hasValidSession(): boolean { // localStoragedaki oturumun hala geçerli olup olmadığını kontrol eder
    const session = this.authStorage.getValidSession();

    if (session === null) {
      this.currentUserSignal.set(null);
      return false;
    }

    this.currentUserSignal.set(session);
    return true;
  }

  hasRole(roleName: string): boolean { // kullanıcının verilen role sahip olup olmadığını kontrol eder
    return this.currentUserSignal()?.roles.includes(roleName) ?? false;
  }

  logout(): void { // kullanıcı oturumunu temizleyip login sayfasına yönlendirir
    this.authStorage.clear();
    this.currentUserSignal.set(null);
    void this.router.navigateByUrl('/login');
  }

  private setSession(response: AuthResponse): void { // backendden gelen oturum bilgisini storagea ve signala kaydeder
    this.authStorage.save(response);//sayfa yenilenince kullanıcı kaybolmasın 
    this.currentUserSignal.set(response);//ekran anında güncellensin
  }
}