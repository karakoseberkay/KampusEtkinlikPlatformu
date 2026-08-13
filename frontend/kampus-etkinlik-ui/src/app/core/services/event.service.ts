import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  API_BASE_URL
} from '../config/api.config';

import {
  CreateEventRequest,
  EventResponse,
  PopularEventResponse,
  UpdateEventRequest
} from '../models/api.models';


@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly http =
    inject(HttpClient);


  getAll(): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(
      `${API_BASE_URL}/Events`
    );
  }


  getPopular(
    limit = 10
  ): Observable<PopularEventResponse[]> {
    const params =
      new HttpParams()
        .set('limit', limit);

    return this.http.get<
      PopularEventResponse[]
    >(
      `${API_BASE_URL}/Events/popular`,
      {
        params
      }
    );
  }


  getById(
    id: number
  ): Observable<EventResponse> {
    return this.http.get<EventResponse>(
      `${API_BASE_URL}/Events/${id}`
    );
  }


  create(
    request: CreateEventRequest
  ): Observable<EventResponse> {
    return this.http.post<EventResponse>(
      `${API_BASE_URL}/Events`,
      request
    );
  }


  update(
    id: number,
    request: UpdateEventRequest
  ): Observable<EventResponse> {
    return this.http.put<EventResponse>(
      `${API_BASE_URL}/Events/${id}`,
      request
    );
  }


  cancel(
    id: number
  ): Observable<EventResponse> {
    return this.http.put<EventResponse>(
      `${API_BASE_URL}/Events/${id}/cancel`,
      {}
    );
  }
}