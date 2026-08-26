import { inject, Injectable } from '@angular/core'; // inject ve injectable yapısını kullanmak için
import { HttpClient } from '@angular/common/http'; // backende http istekleri göndermek için
import { Observable } from 'rxjs'; // backendden gelen async sonuçları observable olarak kullanmak için
import { API_BASE_URL } from '../config/api.config'; // backend api adresini kullanmak için
import { UpdateUserRoleRequest, UserResponse } from '../models/api.models'; // kullanıcı bilgileri ve rol güncelleme modelini kullanmak için

@Injectable({
  providedIn: 'root' // servisin uygulama genelinde kullanılmasını sağlar
})
export class UserService {
  private readonly http = inject(HttpClient); // backende http istekleri göndermemizi sağlar

  getAll(): Observable<UserResponse[]> { // tüm kullanıcıları backendden getirir
    return this.http.get<UserResponse[]>(`${API_BASE_URL}/Users`); // users endpointine get isteği gönderir
  }

  updateRole(userId: string, request: UpdateUserRoleRequest): Observable<UserResponse> { // verilen kullanıcının rolünü değiştirmek için kullanılır
    return this.http.put<UserResponse>(`${API_BASE_URL}/Users/${userId}/role`, request);
       // rolü değiştirilecek kullanıcının idsini url içine ekler
     // kullanıcıya verilecek yeni rol bilgisini backend'e gönderir
    
  }
}