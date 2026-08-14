 
using KampusEtkinlik.Api.Models; // Event modeline erişmemizi sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir


public interface IEventRepository // etkinlik veritabanı işlemlerinin hangi metotlara sahip olması gerektiğini belirler
{
    Task<List<Event>> GetAllAsync(
        CancellationToken cancellationToken = default
    ); // tüm etkinlikleri veritabanından liste olarak getirir


    Task<List<Event>> GetPopularAsync(int limit,// en fazla kaç popüler etkinlik getirileceğini belirtir
        CancellationToken cancellationToken = default
    ); // popüler etkinlikleri belirlenen sayı kadar getirir, popülerliğin nasıl hesaplandığını EventRepositoryde


    Task<Event?> GetByIdAsync(
        int id, // getirilecek etkinliğin idsini alır
        CancellationToken cancellationToken = default
    ); // etkinliği idsine göre getirir, bulunamazsa null döner


    Task AddAsync(
        Event eventItem, // veritabanına eklenecek etkinlik nesnesini alır
        CancellationToken cancellationToken = default
    ); // yeni etkinliği DbContext üzerinden eklenmek üzere hazırlar


    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);        
     // etkinlik üzerindeki ekleme ve güncelleme değişikliklerini veritabanına kaydeder

    Task<(List<Event> Items, int TotalCount)> GetPagedAsync(
    string? search,
    string? category,
    int? clubId,
    DateTimeOffset? dateFrom,
    DateTimeOffset? dateTo,
    bool upcomingOnly,
    int page,
    int pageSize,
    CancellationToken cancellationToken = default
);

}
 
