import { inject, Injectable } from '@angular/core'; // inject ve injectable yapısını kullanmak için
import { HttpClient } from '@angular/common/http'; // backende http istekleri göndermek için
import { Observable } from 'rxjs'; // backendden gelen async sonuçları observable olarak kullanmak için
import { API_BASE_URL } from '../config/api.config'; // backend api adresini kullanmak için
import { ClubResponse, ClubStatsResponse, CreateClubRequest, UpdateClubRequest } from '../models/api.models'; // kulüp request response ve istatistik modellerini kullanmak için

@Injectable({
  providedIn: 'root' // servisin uygulama genelinde kullanılmasını sağlar
})
export class ClubService {
  private readonly http = inject(HttpClient); // backende http istekleri göndermemizi sağlar

  getAll(): Observable<ClubResponse[]> { // tüm kulüpleri backendden getirir
    return this.http.get<ClubResponse[]>(`${API_BASE_URL}/Clubs`); // clubs endpointine get isteği gönderir
  }

  getById(id: number): Observable<ClubResponse> { // verilen idye sahip kulübü backendden getirir
    return this.http.get<ClubResponse>(`${API_BASE_URL}/Clubs/${id}`); // kulüp idsini urlye ekleyerek detay isteğini gönderir
  }

  getStats(id: number): Observable<ClubStatsResponse> { // verilen kulübün istatistiklerini backendden getirir
    return this.http.get<ClubStatsResponse>(`${API_BASE_URL}/Clubs/${id}/stats`); // kulüp idsine göre istatistik endpointine get isteği gönderir
  }

  create(request: CreateClubRequest): Observable<ClubResponse> { // yeni kulüp oluşturmak için verileri backende gönderir
    return this.http.post<ClubResponse>(`${API_BASE_URL}/Clubs`, request); // kulüp bilgilerini request body içinde post isteğiyle gönderir
  }

  update(id: number, request: UpdateClubRequest): Observable<ClubResponse> { // verilen idye sahip kulübü günceller
    return this.http.put<ClubResponse>(`${API_BASE_URL}/Clubs/${id}`, request); // güncellenecek kulüp idsini urlye yeni bilgileri request bodyye ekler
  }

  delete(id: number): Observable<void> { // verilen idye sahip kulübü siler(void denilmesinin sebebi bir dönüş beklemiyoruz)
    return this.http.delete<void>(`${API_BASE_URL}/Clubs/${id}`); // silinecek kulübün idsini urlye ekleyerek delete isteği gönderir
  }
}