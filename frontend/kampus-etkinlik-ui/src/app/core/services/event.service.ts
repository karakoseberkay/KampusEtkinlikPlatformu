import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CreateEventRequest,
  EventPageQuery,
  EventResponse,
  PagedResponse,
  PopularEventResponse,
  UpdateEventRequest
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly http = inject(HttpClient); // backende http istekleri göndermemizi sağlar

  getAll(): Observable<EventResponse[]> { // tüm etkinlikleri backendden getirir
    return this.http.get<EventResponse[]>(`${API_BASE_URL}/Events`);
  }

  getPaged(query: EventPageQuery): Observable<PagedResponse<EventResponse>> { // etkinlikleri filtreli ve sayfalı şekilde backendden getirir
    let params = new HttpParams();

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.category) {
      params = params.set('category', query.category);
    }

    if (query.clubId !== undefined) {
      params = params.set('clubId', query.clubId.toString());
    }

    if (query.dateFrom) {
      params = params.set('dateFrom', query.dateFrom);
    }

    if (query.dateTo) {
      params = params.set('dateTo', query.dateTo);
    }

    if (query.upcomingOnly !== undefined) {
      params = params.set('upcomingOnly', query.upcomingOnly.toString());
    }

    params = params.set('page', (query.page ?? 1).toString()); // sayfa verilmezse ilk sayfayı kullanır
    params = params.set('pageSize', (query.pageSize ?? 10).toString()); // sayfa boyutu verilmezse 10 kullanır

    return this.http.get<PagedResponse<EventResponse>>(
      `${API_BASE_URL}/Events/paged`,
      { params }
    );
  }

  getPopular(limit = 10): Observable<PopularEventResponse[]> { // en popüler etkinlikleri backendden getirir
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<PopularEventResponse[]>(
      `${API_BASE_URL}/Events/popular`,
      { params }
    );
  }

  getById(id: number): Observable<EventResponse> { // verilen idye sahip etkinliği backendden getirir
    return this.http.get<EventResponse>(`${API_BASE_URL}/Events/${id}`);
  }

  create(request: CreateEventRequest): Observable<EventResponse> { // yeni etkinlik oluşturmak için verileri backende gönderir
    return this.http.post<EventResponse>(`${API_BASE_URL}/Events`, request);
  }

  update(id: number, request: UpdateEventRequest): Observable<EventResponse> { // verilen idye sahip etkinliği günceller
    return this.http.put<EventResponse>(`${API_BASE_URL}/Events/${id}`, request);
  }

  cancel(id: number): Observable<EventResponse> { // verilen idye sahip etkinliği iptal eder
    return this.http.put<EventResponse>(`${API_BASE_URL}/Events/${id}/cancel`, {});
  }
}