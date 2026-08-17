import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {ClubResponse, ClubStatsResponse, CreateClubRequest, UpdateClubRequest} from '../models/api.models';
 
 


@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private readonly http = inject(HttpClient); // backende http istekleri göndermemizi sağlar

  getAll(): Observable<ClubResponse[]> { // tüm kulüpleri backendden getirir
    return this.http.get<ClubResponse[]>(`${API_BASE_URL}/Clubs`);
  }

  getById(id: number): Observable<ClubResponse> { // verilen idye sahip kulübü backendden getirir
    return this.http.get<ClubResponse>(`${API_BASE_URL}/Clubs/${id}`);
  }

  getStats(id: number): Observable<ClubStatsResponse> { // verilen kulübün istatistiklerini backendden getirir
    return this.http.get<ClubStatsResponse>(`${API_BASE_URL}/Clubs/${id}/stats`);
  }

  create(request: CreateClubRequest): Observable<ClubResponse> { // yeni kulüp oluşturmak için verileri backende gönderir
    return this.http.post<ClubResponse>(`${API_BASE_URL}/Clubs`, request);
  }

  update(id: number, request: UpdateClubRequest): Observable<ClubResponse> { // verilen idye sahip kulübü günceller
    return this.http.put<ClubResponse>(`${API_BASE_URL}/Clubs/${id}`, request);
  }

  delete(id: number): Observable<void> { // verilen idye sahip kulübü siler
    return this.http.delete<void>(`${API_BASE_URL}/Clubs/${id}`);
  }
}