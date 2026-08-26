using KampusEtkinlik.Api.DTOs.Events; // Event request response ve popular event DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.DTOs.Common; // Sayfalama sonucunu döndüren PagedResponse DTOsuna erişmemizi sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir

public interface IEventService // etkinlikle ilgili iş kurallarının hangi işlemleri yapacağını belirleyen servis sözleşmesidir
{
    Task<IReadOnlyList<PopularEventResponse>> GetPopularAsync(
        int limit, // en fazla kaç popüler etkinlik getirileceğini belirtir
        CancellationToken cancellationToken = default);
    // popüler etkinlikleri frontend'e uygun response listesi olarak getirir

    Task<IReadOnlyList<EventResponse>> GetAllAsync(
        CancellationToken cancellationToken = default);
    // tüm etkinlikleri frontend'e uygun EventResponse listesi olarak getirir

    Task<EventResponse?> GetByIdAsync(
        int id, // getirilecek etkinliğin idsini alır
        CancellationToken cancellationToken = default);
    // verilen idye sahip etkinliği getirir, bulunamazsa null döner

    Task<EventResponse> CreateAsync(
        string managerUserId, // etkinliği oluşturacak kulüp yöneticisinin kullanıcı idsini alır
        CreateEventRequest request, // frontendden gelen etkinlik oluşturma bilgilerini alır
        CancellationToken cancellationToken = default
    ); // gerekli kontrollerden sonra yeni etkinlik oluşturur ve sonucu döndürür

    Task<EventResponse?> UpdateAsync(
        int id, // güncellenecek etkinliğin idsini alır
        string managerUserId, // işlemi yapan kulüp yöneticisinin kullanıcı idsini alır
        UpdateEventRequest request, // frontendden gelen yeni etkinlik bilgilerini alır
        CancellationToken cancellationToken = default
    ); // yetki ve iş kuralı kontrollerinden sonra etkinliği günceller, bulunamazsa null döner

    Task<EventResponse?> CancelAsync(
        int id, // iptal edilecek etkinliğin idsini alır
        string managerUserId, // iptal işlemini yapan kulüp yöneticisinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    ); // etkinliği fiziksel olarak silmek yerine durumunu Cancelled yapar, bulunamazsa null döner

    Task<PagedResponse<EventResponse>> GetPagedAsync(
        string? search, // etkinlik başlığı veya benzeri alanlarda yapılacak arama değerini alır, filtre yoksa null olabilir
        string? category, // etkinlikleri belirli bir kategoriye göre filtrelemek için kullanılır
        int? clubId, // sadece belirli bir kulübe ait etkinlikleri getirmek için kulüp idsini alır
        DateTimeOffset? dateFrom, // bu tarihten itibaren başlayan etkinlikleri filtrelemek için kullanılır
        DateTimeOffset? dateTo, // bu tarihe kadar olan etkinlikleri filtrelemek için kullanılır
        bool upcomingOnly, // true ise sadece henüz başlamamış yaklaşan etkinliklerin getirilmesini sağlar
        int page, // getirilecek sayfanın numarasını belirtir
        int pageSize, // bir sayfada kaç etkinlik bulunacağını belirtir
        CancellationToken cancellationToken = default
    ); // filtrelere göre etkinlikleri sayfalı şekilde getirir ve PagedResponse olarak döndürür
}