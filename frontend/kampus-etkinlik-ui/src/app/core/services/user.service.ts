import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { UpdateUserRoleRequest, UserResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient); // backende http istekleri göndermemizi sağlar

  getAll(): Observable<UserResponse[]> { // tüm kullanıcıları backendden getirir
    return this.http.get<UserResponse[]>(`${API_BASE_URL}/Users`);
  }

  updateRole(userId: string, request: UpdateUserRoleRequest): Observable<UserResponse> { // verilen kullanıcının rolünü değiştirmek için isteği backende gönderir
    return this.http.put<UserResponse>(`${API_BASE_URL}/Users/${userId}/role`, request);
  }
}