import {
  computed,
  inject,
  Injectable,
  signal
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  Observable,
  tap
} from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

import {
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from '../models/auth.models';

import {
  AuthStorageService
} from './auth-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly authStorage =
    inject(AuthStorageService);

  private readonly currentUserSignal =
    signal<AuthResponse | null>(
      this.authStorage.getValidSession()
    );

  readonly currentUser =
    this.currentUserSignal.asReadonly();

  readonly isAuthenticated = computed(
    () => this.currentUserSignal() !== null
  );

  readonly roles = computed(
    () => this.currentUserSignal()?.roles ?? []
  );

  login(
    request: LoginRequest
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${API_BASE_URL}/Auth/login`,
        request
      )
      .pipe(
        tap(response => {
          this.setSession(response);
        })
      );
  }

  register(
    request: RegisterRequest
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${API_BASE_URL}/Auth/register`,
        request
      )
      .pipe(
        tap(response => {
          this.setSession(response);
        })
      );
  }

  getMe(): Observable<AuthResponse> {
    return this.http
      .get<AuthResponse>(
        `${API_BASE_URL}/Auth/me`
      )
      .pipe(
        tap(response => {
          this.setSession(response);
        })
      );
  }

  hasValidSession(): boolean {
    const session =
      this.authStorage.getValidSession();

    if (session === null) {
      this.currentUserSignal.set(null);
      return false;
    }

    this.currentUserSignal.set(session);
    return true;
  }

  hasRole(roleName: string): boolean {
    return this.currentUserSignal()
      ?.roles
      .includes(roleName)
      ?? false;
  }

  logout(): void {
    this.authStorage.clear();
    this.currentUserSignal.set(null);

    void this.router.navigateByUrl('/login');
  }

  private setSession(
    response: AuthResponse
  ): void {
    this.authStorage.save(response);
    this.currentUserSignal.set(response);
  }
}