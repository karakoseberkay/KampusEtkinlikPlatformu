import { inject, Injectable } from '@angular/core'; // inject ile servisleri alabilmek ve bu classı Angular servisi olarak tanımlamak için
import { HttpClient, HttpParams } from '@angular/common/http'; // backende HTTP istekleri göndermek ve URL query parametreleri oluşturmak için
import { Observable } from 'rxjs'; // backendden gelecek asenkron sonuçları Observable olarak kullanmak için
import { API_BASE_URL } from '../config/api.config'; // backend API'nin ana adresini kullanmak için
import { CheckInRequest, CheckInResponse, CheckInSessionResponse, CreateCheckInSessionRequest, CreateEventRequest, EventPageQuery, EventResponse, PagedResponse, PopularEventResponse, UpdateEventRequest } from '../models/api.models'; // etkinlik ve check-in işlemlerinde kullanılan request response modellerine erişmek için

@Injectable({
  providedIn: 'root' // servisin uygulama genelinde tek instance olarak kullanılmasını sağlar
  //“Bu class bir servistir ve uygulamanın her yerinden kullanılabilir.”
})
export class EventService {
  private readonly http = inject(HttpClient); // HttpClient servisini DI ile alıp backende HTTP isteği göndermemizi sağlar

  /*
  getAll(): Observable<EventResponse[]> { // tüm etkinlikleri backendden filtresiz getirir şu anda kullanılmadığı için kapalıdır
    return this.http.get<EventResponse[]>(`${API_BASE_URL}/Events`);
  }
  */

  getPaged(query: EventPageQuery): Observable<PagedResponse<EventResponse>> { // etkinlikleri filtreli sıralı ve sayfalı şekilde backendden getirir
    let params = new HttpParams(); // URL query parametrelerini tutar HttpParams immutable olduğu için her set işleminde yeni değer döndürür

    if (query.search) {
      params = params.set('search', query.search); // arama metni varsa URL parametresine ekler
    }

    if (query.category) {
      params = params.set('category', query.category); // kategori seçilmişse URL parametresine ekler
    }

    if (query.clubId !== undefined) {
      params = params.set('clubId', query.clubId.toString()); // number olan clubIdsini URLde kullanılabilmesi için stringe çevirir
    }

    if (query.dateFrom) {
      params = params.set('dateFrom', query.dateFrom); // başlangıç tarihi varsa URL parametresine ekler
    }

    if (query.dateTo) {
      params = params.set('dateTo', query.dateTo); // bitiş tarihi varsa URL parametresine ekler
    }

    if (query.upcomingOnly !== undefined) {
      params = params.set('upcomingOnly', query.upcomingOnly.toString()); // boolean değeri URLde kullanılabilmesi için stringe çevirir
    }

    if (query.sortField) {
      params = params.set('sortField', query.sortField); // sıralama yapılacak alanı URL parametresine ekler
    }

    if (query.sortDirection) {
      params = params.set('sortDirection', query.sortDirection); // asc veya desc sıralama yönünü URL parametresine ekler
    }

    params = params.set('page', (query.page ?? 1).toString()); // ?? page değeri yoksa varsayılan olarak 1 kullanılmasını sağlar
    params = params.set('pageSize', (query.pageSize ?? 10).toString()); // pageSize değeri yoksa varsayılan olarak 10 kullanır

    return this.http.get<PagedResponse<EventResponse>>(`${API_BASE_URL}/Events/paged`, { params });
    // hazırlanan query parametreleriyle GET isteği gönderir ve sayfalanmış EventResponse sonucu bekler
  }

  getPopular(limit = 10): Observable<PopularEventResponse[]> { // en popüler etkinlikleri backendden getirir limit verilmezse 10 kullanır
    const params = new HttpParams().set('limit', limit.toString()); // getirilecek etkinlik sayısını URL parametresi olarak hazırlar
    return this.http.get<PopularEventResponse[]>(`${API_BASE_URL}/Events/popular`, { params });
    // GET isteği gönderir ve PopularEventResponse listesinin dönmesini bekler
  }

  getById(id: number): Observable<EventResponse> { // verilen idye sahip etkinliği backendden getirir
    return this.http.get<EventResponse>(`${API_BASE_URL}/Events/${id}`);
    // template literal ile eventi idsini URLye ekleyip GET isteği gönderir
  }

  create(request: CreateEventRequest): Observable<EventResponse> { // yeni etkinlik oluşturmak için verileri backende gönderir
    return this.http.post<EventResponse>(`${API_BASE_URL}/Events`, request);
    // POST ile request nesnesini body içinde gönderir ve oluşturulan EventResponse bilgisini bekler
  }

  update(id: number, request: UpdateEventRequest): Observable<EventResponse> { // verilen idye sahip etkinliği günceller
    return this.http.put<EventResponse>(`${API_BASE_URL}/Events/${id}`, request);
    // PUT ile güncel etkinlik bilgilerini body içerisinde backende gönderir
  }

  cancel(id: number): Observable<EventResponse> { // verilen idye sahip etkinliği iptal eder
    return this.http.put<EventResponse>(`${API_BASE_URL}/Events/${id}/cancel`, {});
    // cancel endpointine PUT isteği gönderir bodyde veri gerekmediği için boş nesne gönderir
  }

  createCheckInSession(eventId: number, request: CreateCheckInSessionRequest): Observable<CheckInSessionResponse> {
    return this.http.post<CheckInSessionResponse>(`${API_BASE_URL}/events/${eventId}/check-in-session`, request);
    // clubmanagerın seçtiği etkinlik ve süre bilgisini backende gönderip geçici qr tokenını alır
  }

  checkIn(request: CheckInRequest): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(`${API_BASE_URL}/check-in`, request);
    // qr koddan alınan tokenı backende gönderip kullanıcının etkinliğe katılımını kaydeder
  }
}