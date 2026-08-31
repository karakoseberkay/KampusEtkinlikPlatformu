using KampusEtkinlik.Api.Models; // Event modeline erişmemizi sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir

public interface IEventRepository // etkinlik veritabanı işlemlerinin hangi metotlara sahip olması gerektiğini belirler
{
    Task<List<Event>> GetAllAsync(
        CancellationToken cancellationToken = default
    ); // tüm etkinlikleri veritabanından liste olarak getirir

    Task<List<Event>> GetPopularAsync(
        int limit, // en fazla kaç popüler etkinlik getirileceğini belirtir
        CancellationToken cancellationToken = default
    ); // popüler etkinlikleri belirlenen sayı kadar getirir, popülerliğin nasıl hesaplandığını EventRepository belirler

    Task<Event?> GetByIdAsync(
        int id, // getirilecek etkinliğin idsini alır
        CancellationToken cancellationToken = default
    ); // etkinliği idsine göre getirir, bulunamazsa null döner

    Task AddAsync(
        Event eventItem, // veritabanına eklenecek etkinlik nesnesini alır
        CancellationToken cancellationToken = default
    ); // yeni etkinliği DbContext üzerinden eklenmek üzere hazırlar

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    ); // etkinlik üzerindeki ekleme ve güncelleme değişikliklerini veritabanına kaydeder

    Task<(List<Event> Items, int TotalCount)> GetPagedAsync(//burada tuple kullanılıyor iki veri istenilerek(etkinlikler ve etkinlik sayısı)
        string? search, // etkinlikleri arama metnine göre filtrelemek için kullanılır, filtre yoksa null olabilir
        string? category, // etkinlikleri belirli bir kategoriye göre filtrelemek için kullanılır
        int? clubId, // sadece belirli bir kulübe ait etkinlikleri getirmek için kulüp idsini alır
        DateTimeOffset? dateFrom, // bu tarihten itibaren başlayan etkinlikleri filtrelemek için kullanılır
        DateTimeOffset? dateTo, // bu tarihe kadar başlayan etkinlikleri filtrelemek için kullanılır
        bool upcomingOnly, // true ise sadece yaklaşan etkinliklerin getirilmesini sağlar
        string? sortField, // hangi etkinlik alanına göre sıralama yapılacağını belirtir
        string? sortDirection, // sıralamanın artan asc veya azalan desc olacağını belirtir
        int page, // veritabanından hangi sayfanın getirileceğini belirtir
        int pageSize, // bir sayfada kaç etkinlik bulunacağını belirtir
        CancellationToken cancellationToken = default
    ); // filtrelenmiş etkinlikleri ve filtrelere uyan toplam etkinlik sayısını birlikte döndürür
}