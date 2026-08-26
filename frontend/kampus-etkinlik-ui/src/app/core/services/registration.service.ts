import { inject, Injectable } from '@angular/core'; // inject ile HttpClient servisini almak ve Injectable kullanmak için
import { HttpClient, HttpParams } from '@angular/common/http'; // Backend'e HTTP isteği göndermek ve query parametreleri oluşturmak için
import { Observable } from 'rxjs'; // Backend'den gelecek async sonuçları Observable olarak kullanmak için
import { API_BASE_URL } from '../config/api.config'; // Backend API'nin ana adresini kullanmak için
import { RegistrationApprovalStatus, RegistrationResponse } from '../models/api.models'; // Kayıt durumunu ve backendden gelen kayıt modelini kullanmak için

@Injectable({
  providedIn: 'root' // Servisin uygulama genelinde tek instance olarak kullanılmasını sağlar
})
export class RegistrationService {
  private readonly http = inject(HttpClient); // Backende HTTP istekleri göndermemizi sağlar

  register(eventId: number): Observable<RegistrationResponse> { // Öğrenciyi verilen etkinliğe kaydeder
    return this.http.post<RegistrationResponse>(`${API_BASE_URL}/events/${eventId}/register`, {});
       // Etkinlik IDsini URL içine ekleyerek kayıt endpointini oluşturur
       // Boş body gider çünkü etkinlik URLdeki IDden, kullanıcı ise JWT tokenından belli olur
    
  }

  getMine(): Observable<RegistrationResponse[]> { // Giriş yapan öğrencinin kendi kayıtlarını backendden getirir
    return this.http.get<RegistrationResponse[]>(`${API_BASE_URL}/Registrations/me`);}
     // JWTdeki kullanıcıya ait bütün kayıtları GET isteğiyle getirir
  

  getForEvent(eventId: number, approvalStatus?: RegistrationApprovalStatus): Observable<RegistrationResponse[]> {
     // Kayıtları getirilecek etkinliğin IDsini alır
    // İsteğe bağlı olarak kayıt durumuna göre filtreleme yapılmasını sağlar
  
    let params = new HttpParams(); // Backend'e gönderilecek query parametrelerini tutacak boş HttpParams oluşturur

    if (approvalStatus) { // Durum filtresi gönderilmişse
      params = params.set('approvalStatus', approvalStatus); // Durumu URL query parametresine ekler
    }

    return this.http.get<RegistrationResponse[]>(`${API_BASE_URL}/events/${eventId}/registrations`, { params });
     // Etkinliğin kayıtlarını varsa durum filtresiyle beraber backendden getirir
  }

  approve(id: number): Observable<RegistrationResponse> { // Verilen kayıt talebini onaylar
    return this.http.put<RegistrationResponse>(`${API_BASE_URL}/Registrations/${id}/approve`, {});
       // Onaylanacak kayıt IDsini URL içine ekler
      // Backend sadece kayıt IDsine ve JWT bilgisine ihtiyaç duyduğu için boş body gönderilir
    
  }

  reject(id: number): Observable<RegistrationResponse> { // Verilen kayıt talebini reddeder
    return this.http.put<RegistrationResponse>(`${API_BASE_URL}/Registrations/${id}/reject`, {});
       // Reddedilecek kayıt IDsini URL içine ekler
       // Ekstra veri gönderilmediği için request body boş bırakılır
    
  }
}