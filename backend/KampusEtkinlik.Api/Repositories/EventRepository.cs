using KampusEtkinlik.Api.Data; // ApplicationDbContext üzerinden veritabanına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Event modeline erişmemizi sağlar
using Microsoft.EntityFrameworkCore; // Include AsNoTracking Where ToListAsync gibi EF Core metotlarını kullanmamızı sağlar
using KampusEtkinlik.Api.Enums; // EventStatus ve RegistrationApprovalStatus enumlarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir

public sealed class EventRepository(ApplicationDbContext dbContext) : IEventRepository
{
    // etkinlik veritabanı işlemlerini yapacağımız DbContexti DI üzerinden alır
    // IEventRepositoryde tanımlanan etkinlik veritabanı işlemlerini gerçekleştirir

    public async Task<List<Event>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Events // Events tablosu üzerinde sorgu başlatır
            .AsNoTracking() // sadece okuma yapılacağı için EF Coreun değişiklik takibi yapmasını engeller
            .Include(eventItem => eventItem.Club) // her etkinlikle beraber bağlı olduğu kulübü de getirir
            .OrderBy(eventItem => eventItem.StartDate) // etkinlikleri başlangıç tarihine göre eskiden yeniye sıralar
            .ToListAsync(cancellationToken); // sorguyu veritabanında çalıştırıp etkinlikleri liste olarak getirir
    }

    public async Task<List<Event>> GetPopularAsync(
        int limit, // en fazla kaç popüler etkinlik getirileceğini belirler
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Events // Events tablosu üzerinde sorgu başlatır
            .AsNoTracking() // sadece okuma yapılacağı için değişiklik takibini kapatır
            .Include(eventItem => eventItem.Club) // etkinliğin bağlı olduğu kulüp bilgisini de getirir
            .Include(eventItem => eventItem.Registrations) // etkinliğin kayıtlarını da getirir
            .Where(eventItem =>eventItem.Status == EventStatus.Active && eventItem.StartDate > DateTimeOffset.UtcNow
            ) // sadece aktif ve henüz başlamamış etkinlikleri alır
            .OrderByDescending(eventItem => eventItem.Registrations.Count(registration =>
                
                    registration.ApprovalStatus == RegistrationApprovalStatus.Approved
                )
            ) // etkinlikleri onaylanmış kayıt sayısı en fazla olandan en aza doğru sıralar
            .ThenBy(eventItem => eventItem.StartDate) // onaylı kayıt sayıları eşitse daha erken başlayacak etkinliği önce getirir
            .Take(limit) // sıralanan etkinliklerden sadece istenen sayı kadarını alır
            .ToListAsync(cancellationToken); // sorguyu çalıştırıp popüler etkinlikleri liste olarak getirir
    }

    public async Task<Event?> GetByIdAsync(
        int id, // getirilecek etkinliğin idsini alır
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Events // Events tablosu üzerinde sorgu başlatır
            .Include(eventItem => eventItem.Club) // etkinlikle beraber bağlı olduğu kulüp bilgisini de getirir
            .FirstOrDefaultAsync(eventItem => eventItem.Id == id, cancellationToken);
        // verilen idye sahip etkinliği arar
        // etkinlik bulunursa döndürür, bulunamazsa null döndürür
    }

    public async Task<(List<Event> Items, int TotalCount)> GetPagedAsync(
        string? search, // arama metnini alır, gönderilmediyse null olabilir
        string? category, // kategori filtresini alır
        int? clubId, // kulüp filtresini alır, gönderilmediyse null olabilir
        DateTimeOffset? dateFrom, // başlangıç tarihi filtresini alır
        DateTimeOffset? dateTo, // bitiş tarihi filtresini alır
        bool upcomingOnly, // sadece yaklaşan etkinliklerin istenip istenmediğini belirtir
        int page, // getirilecek sayfa numarasını belirtir
        int pageSize, // bir sayfada kaç etkinlik getirileceğini belirtir
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Events // Events tablosu üzerinden temel sorguyu oluşturur
            .AsNoTracking() // sadece okuma yapılacağı için EF Coreun değişiklik takibini kapatır
            .Include(eventItem => eventItem.Club) // etkinliklerle beraber bağlı oldukları kulüp bilgilerini de sorguya ekler
            .AsQueryable();
        // Sorguyu IQueryable olarak tutar
        // IQueryable sayesinde aşağıdaki filtreler şartlara göre sorguya parça parça eklenebilir
        // Sorgu bu aşamada henüz veritabanında çalıştırılmaz

        if (upcomingOnly)
        {
            query = query.Where(eventItem =>eventItem.Status == EventStatus.Active && eventItem.StartDate > DateTimeOffset.UtcNow);
            // upcomingOnly true ise sadece aktif ve henüz başlamamış etkinlikleri sorguya dahil eder
        }

        if (!string.IsNullOrWhiteSpace(search))
        // search null boş veya sadece boşluklardan oluşmuyorsa arama filtresini uygular
        {
            var searchPattern = $"%{search.Trim()}%";
                
            // Trim baştaki ve sondaki gereksiz boşlukları temizler
            // % işareti SQL tarafında önünde veya arkasında başka karakterler bulunabileceğini belirtir
            // örneğin search "yapay" ise "%yapay%" içinde yapay geçen metinleri bulabilir

            query = query.Where(eventItem =>
                EF.Functions.ILike(//ilike büyük küçük harf duyarsızlığı
                    eventItem.Title,
                    searchPattern
                ) ||
                
                EF.Functions.ILike(
                    eventItem.Description,
                    searchPattern
                ) ||
                
                EF.Functions.ILike(
                    eventItem.Location,
                    searchPattern
                ));
            
            // ILike PostgreSQLde büyük küçük harf duyarsız metin araması yapar
            // başlık açıklama veya konum alanlarından herhangi biri eşleşirse etkinlik sorguya dahil edilir
        }

        if (!string.IsNullOrWhiteSpace(category))
        // kategori değeri gönderilmişse kategori filtresini uygular
        {
            var categoryValue = category.Trim();
                
            // kategorinin başındaki ve sonundaki gereksiz boşlukları temizler

            query = query.Where(eventItem => EF.Functions.ILike(
               
                    eventItem.Category,
                    categoryValue
                )
            );
            // kategori alanını büyük küçük harf duyarsız şekilde karşılaştırır
            // burada % kullanılmadığı için kategori değerinin tamamının eşleşmesi beklenir
        }

        if (clubId.HasValue)
        // nullable clubId gerçekten bir değer taşıyorsa kulüp filtresini uygular
        {
            query = query.Where(eventItem => eventItem.ClubId == clubId.Value);
               
            
            // sadece seçilen kulübe ait etkinlikleri sorguda bırakır
            // Value nullable int içerisindeki gerçek sayısal değeri verir
        }

        if (dateFrom.HasValue)
        // başlangıç tarihi gönderilmişse tarih filtresini uygular
        {
            var from = dateFrom.Value.ToUniversalTime();
               
            // gelen tarihi UTC zamanına çevirir
            // böylece veritabanındaki tarih karşılaştırmalarının aynı zaman standardında yapılmasını sağlar

            query = query.Where(eventItem => eventItem.StartDate >= from);
               
            
            // başlangıç tarihi seçilen tarihe eşit veya daha sonraki etkinlikleri alır
        }

        if (dateTo.HasValue)
        // bitiş tarihi gönderilmişse tarih filtresini uygular
        {
            var to = dateTo.Value.ToUniversalTime();
               
            // gelen bitiş tarihini UTC zamanına çevirir

            query = query.Where(eventItem => eventItem.StartDate <= to);
               
            
            // başlangıç tarihi seçilen bitiş tarihine eşit veya daha önce olan etkinlikleri alır
        }

        var totalCount = await query.CountAsync(cancellationToken);
        // sayfalama uygulanmadan önce filtrelere uyan toplam etkinlik sayısını veritabanından hesaplar
        // bu değer frontend tarafında toplam kayıt ve toplam sayfa bilgisini oluşturmak için kullanılır

        var items = await query.OrderBy(eventItem => eventItem.StartDate)
                 // etkinlikleri başlangıç tarihine göre sıralar
                .Skip((page - 1) * pageSize)
                    
                 // önceki sayfalara ait kayıtları atlar
                .Take(pageSize) // sadece mevcut sayfada gösterilecek kayıt sayısı kadar veri alır
                .ToListAsync(cancellationToken);
                    
                
        // sorguyu burada gerçekten veritabanında çalıştırır ve o sayfadaki etkinlikleri liste olarak getirir

        return (items, totalCount);
        // aynı anda hem o sayfadaki etkinlikleri hem de filtrelere uyan toplam kayıt sayısını tuple olarak service katmanına döndürür
    }

    public async Task AddAsync(
        Event eventItem, // veritabanına eklenecek etkinlik nesnesini alır
        CancellationToken cancellationToken = default)
    {
        await dbContext.Events.AddAsync(eventItem, cancellationToken);
        // etkinliği EF Core tarafından eklenmek üzere takip edilen nesnelere ekler
        // henüz veritabanına kaydetmez, gerçek kayıt SaveChangesAsync çağrıldığında yapılır
    }

    public Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
        // bekleyen etkinlik ekleme veya güncelleme işlemlerini PostgreSQL veritabanına kaydeder
    }
}