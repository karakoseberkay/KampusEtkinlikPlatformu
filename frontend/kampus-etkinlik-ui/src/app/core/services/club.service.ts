import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  API_BASE_URL
} from '../config/api.config';

import {
  ClubResponse,
  ClubStatsResponse,
  CreateClubRequest,
  UpdateClubRequest
} from '../models/api.models';


@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private readonly http =
    inject(HttpClient);


  getAll(): Observable<ClubResponse[]> {
    return this.http.get<ClubResponse[]>(
      `${API_BASE_URL}/Clubs`
    );
  }


  getById(
    id: number
  ): Observable<ClubResponse> {
    return this.http.get<ClubResponse>(
      `${API_BASE_URL}/Clubs/${id}`
    );
  }


  getStats(
    id: number
  ): Observable<ClubStatsResponse> {
    return this.http.get<ClubStatsResponse>(
      `${API_BASE_URL}/Clubs/${id}/stats`
    );
  }


  create(
    request: CreateClubRequest
  ): Observable<ClubResponse> {
    return this.http.post<ClubResponse>(
      `${API_BASE_URL}/Clubs`,
      request
    );
  }


  update(
    id: number,
    request: UpdateClubRequest
  ): Observable<ClubResponse> {
    return this.http.put<ClubResponse>(
      `${API_BASE_URL}/Clubs/${id}`,
      request
    );
  }


  delete(
    id: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE_URL}/Clubs/${id}`
    );
  }
}