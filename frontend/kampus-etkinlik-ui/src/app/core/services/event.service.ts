import { inject, Injectable } from '@angular/core'; // inject ile HttpClient gibi servisleri alabilmek ve Injectable kullanmak için
import { HttpClient, HttpParams } from '@angular/common/http'; // Backend'e HTTP isteği göndermek ve query parametreleri oluşturmak için
import { Observable } from 'rxjs'; // Backend'den gelecek async sonuçları Observable olarak kullanmak için
import { API_BASE_URL } from '../config/api.config'; // Backend API'nin ana adresini kullanmak için
import {
  CreateEventRequest,
  EventPageQuery,
  EventResponse,
  PagedResponse,
  PopularEventResponse,
  UpdateEventRequest
} from '../models/api.models'; // Etkinlik request, response ve sayfalama modellerini kullanmak için

@Injectable({
  providedIn: 'root' // Servisin uygulama genelinde tek instance olarak kullanılmasını sağlar
})
export class EventService {
  private readonly http = inject(HttpClient); // Backend'e HTTP istekleri göndermemizi sağlar

/*
  getAll(): Observable<EventResponse[]> { // Tüm etkinlikleri backendden getirir(filtresiz)
    return this.http.get<EventResponse[]>(`${API_BASE_URL}/Events`);
  }*/

  getPaged(query: EventPageQuery): Observable<PagedResponse<EventResponse>> { // Etkinlikleri filtreli ve sayfalı şekilde backendden getirir
    let params = new HttpParams(); // Backend'e gönderilecek query parametrelerini tutacak boş HttpParams oluşturur(immutable yapı yani değiştirmez yeni oluşturur)

    if (query.search) { // Arama değeri girilmişse
      params = params.set('search', query.search); // URL'e search query parametresini ekler
    }

    if (query.category) { // Kategori filtresi seçilmişse
      params = params.set('category', query.category); // URL'e category query parametresini ekler
    }

    if (query.clubId !== undefined) { // Kulüp filtresi gönderilmişse
      params = params.set('clubId', query.clubId.toString()); // Kulüp IDsini stringe çevirip URL parametresi olarak ekler
    }

    if (query.dateFrom) { // Başlangıç tarihi filtresi varsa
      params = params.set('dateFrom', query.dateFrom); // Başlangıç tarihini URL parametresine ekler
    }

    if (query.dateTo) { // Bitiş tarihi filtresi varsa
      params = params.set('dateTo', query.dateTo); // Bitiş tarihini URL parametresine ekler
    }

    if (query.upcomingOnly !== undefined) { // Yaklaşan etkinlik filtresi belirtilmişse
      params = params.set('upcomingOnly', query.upcomingOnly.toString()); // Boolean değeri stringe çevirip URL parametresine ekler
    }

    if (query.sortField) { // sıralama yapılacak alan gönderilmişse
      params = params.set('sortField', query.sortField); // sıralama yapılacak alanı URL parametresine ekler
    }

    if (query.sortDirection) { // sıralama yönü gönderilmişse
      params = params.set('sortDirection', query.sortDirection); // asc veya desc değerini URL parametresine ekler
    }

    params = params.set('page', (query.page ?? 1).toString()); // Sayfa verilmezse ilk sayfayı kullanır
    params = params.set('pageSize', (query.pageSize ?? 10).toString()); // Sayfa boyutu verilmezse 10 kullanır

    return this.http.get<PagedResponse<EventResponse>>(`${API_BASE_URL}/Events/paged`, { params });
     // Oluşturulan filtre sıralama ve sayfalama parametreleriyle backend'e GET isteği gönderir
  }

  getPopular(limit = 10): Observable<PopularEventResponse[]> { // En popüler etkinlikleri backendden getirir
    const params = new HttpParams().set('limit', limit.toString()); // Kaç etkinlik getirileceğini limit query parametresi olarak oluşturur

    return this.http.get<PopularEventResponse[]>(`${API_BASE_URL}/Events/popular`, { params });
     // Limit bilgisiyle popüler etkinlikleri backendden ister
  }

  getById(id: number): Observable<EventResponse> { // Verilen idye sahip etkinliği backendden getirir
    return this.http.get<EventResponse>(`${API_BASE_URL}/Events/${id}`); // Etkinlik IDsini URL'e ekleyip GET isteği gönderir
  }

  create(request: CreateEventRequest): Observable<EventResponse> { // Yeni etkinlik oluşturmak için verileri backende gönderir
    return this.http.post<EventResponse>(`${API_BASE_URL}/Events`, request); // Etkinlik bilgilerini request body içinde POST isteğiyle gönderir
  }

  update(id: number, request: UpdateEventRequest): Observable<EventResponse> { // Verilen idye sahip etkinliği günceller
    return this.http.put<EventResponse>(`${API_BASE_URL}/Events/${id}`, request); // Güncel etkinlik bilgilerini PUT isteğiyle backend'e gönderir
  }

  cancel(id: number): Observable<EventResponse> { // Verilen idye sahip etkinliği iptal eder
    return this.http.put<EventResponse>(`${API_BASE_URL}/Events/${id}/cancel`, {}); // İptal endpointine boş body ile PUT isteği gönderir
  }
}