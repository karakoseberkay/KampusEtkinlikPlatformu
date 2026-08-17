import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  RegistrationApprovalStatus,
  RegistrationResponse
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private readonly http = inject(HttpClient); // backende http istekleri göndermemizi sağlar

  register(eventId: number): Observable<RegistrationResponse> { // öğrenciyi verilen etkinliğe kaydeder
    return this.http.post<RegistrationResponse>(
      `${API_BASE_URL}/events/${eventId}/register`,
      {}
    );
  }

  getMine(): Observable<RegistrationResponse[]> { // giriş yapan öğrencinin kendi kayıtlarını backendden getirir
    return this.http.get<RegistrationResponse[]>(`${API_BASE_URL}/Registrations/me`);
  }

  getForEvent(
    eventId: number,
    approvalStatus?: RegistrationApprovalStatus
  ): Observable<RegistrationResponse[]> { // verilen etkinliğin kayıtlarını durum filtresiyle beraber getirir
    let params = new HttpParams();

    if (approvalStatus) {
      params = params.set('approvalStatus', approvalStatus);
    }

    return this.http.get<RegistrationResponse[]>(
      `${API_BASE_URL}/events/${eventId}/registrations`,
      { params }
    );
  }

  approve(id: number): Observable<RegistrationResponse> { // verilen kayıt talebini onaylar
    return this.http.put<RegistrationResponse>(
      `${API_BASE_URL}/Registrations/${id}/approve`,
      {}
    );
  }

  reject(id: number): Observable<RegistrationResponse> { // verilen kayıt talebini reddeder
    return this.http.put<RegistrationResponse>(
      `${API_BASE_URL}/Registrations/${id}/reject`,
      {}
    );
  }
}