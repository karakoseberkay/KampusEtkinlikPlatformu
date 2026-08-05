import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  inject
} from '@angular/core';

import { AuthResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly storageKey =
    'kampus_etkinlik_auth';

  save(session: AuthResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(session)
    );
  }

  getValidSession(): AuthResponse | null {
    const session = this.read();

    if (session === null) {
      return null;
    }

    const expirationTime =
      new Date(session.expiresAtUtc).getTime();

    const isExpired =
      Number.isNaN(expirationTime)
      || expirationTime <= Date.now();

    if (isExpired) {
      this.clear();
      return null;
    }

    return session;
  }

  getAccessToken(): string | null {
    return this.getValidSession()?.accessToken
      ?? null;
  }

  clear(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.storageKey);
  }

  private read(): AuthResponse | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const storedValue =
      localStorage.getItem(this.storageKey);

    if (!storedValue) {
      return null;
    }

    try {
      const parsedValue =
        JSON.parse(storedValue) as AuthResponse;

      const isValid =
        typeof parsedValue.userId === 'string'
        && typeof parsedValue.fullName === 'string'
        && typeof parsedValue.email === 'string'
        && Array.isArray(parsedValue.roles)
        && typeof parsedValue.accessToken === 'string'
        && typeof parsedValue.expiresAtUtc === 'string';

      if (!isValid) {
        this.clear();
        return null;
      }

      return parsedValue;
    } catch {
      this.clear();
      return null;
    }
  }
}