using KampusEtkinlik.Api.Data; // ApplicationDbContext üzerinden veritabanına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Event modeline erişmemizi sağlar
using Microsoft.EntityFrameworkCore; // Include AsNoTracking Where ToListAsync gibi EF Core metotlarını kullanmamızı sağlar
using KampusEtkinlik.Api.Enums; // EventStatus ve RegistrationApprovalStatus enumlarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir


public sealed class EventRepository(ApplicationDbContext dbContext) : IEventRepository{
     // etkinlik veritabanı işlemlerini yapacağımız DbContexti DI üzerinden alır
 // IEventRepositoryde tanımlanan etkinlik veritabanı işlemlerini gerçekleştirir



    public async Task<List<Event>> GetAllAsync(CancellationToken cancellationToken = default){
        
    
    
        return await dbContext.Events // Events tablosu üzerinde sorgu başlatır
            .AsNoTracking() // sadece okuma yapılacağı için EF Coreun değişiklik takibi yapmasını engeller
            .Include(eventItem => eventItem.Club) // her etkinlikle beraber bağlı olduğu kulübü de getirir
            .OrderBy(eventItem => eventItem.StartDate) // etkinlikleri başlangıç tarihine göre eskiden yeniye sıralar
            .ToListAsync(cancellationToken); // sorguyu veritabanında çalıştırıp etkinlikleri liste olarak getirir
    }



    public async Task<List<Event>> GetPopularAsync(
        int limit, // en fazla kaç popüler etkinlik getirileceğini belirler
        CancellationToken cancellationToken = default){
    
    
        return await dbContext.Events // Events tablosu üzerinde sorgu başlatır
            .AsNoTracking() // sadece okuma yapılacağı için değişiklik takibini kapatır
            .Include(eventItem => eventItem.Club) // etkinliğin bağlı olduğu kulüp bilgisini de getirir
            .Include(eventItem => eventItem.Registrations) // etkinliğin kayıtlarını da getirir

            .Where(eventItem =>eventItem.Status == EventStatus.Active
                 // sadece aktif etkinlikleri alır
                && eventItem.StartDate > DateTimeOffset.UtcNow 
                // sadece henüz başlamamış gelecek etkinlikleri alır
            )

            .OrderByDescending(eventItem =>
                eventItem.Registrations.Count(registration =>
                    registration.ApprovalStatus == RegistrationApprovalStatus.Approved)
                    
                
            )
            // etkinlikleri onaylanmış kayıt sayısı en fazla olandan en aza doğru sıralar

            .ThenBy(eventItem => eventItem.StartDate)
            // onaylı kayıt sayıları eşitse daha erken başlayacak etkinliği önce getirir

            .Take(limit) // sıralanan etkinliklerden sadece istenen sayı kadarını alır

            .ToListAsync(cancellationToken); // sorguyu çalıştırıp popüler etkinlikleri liste olarak getirir
    }



    public async Task<Event?> GetByIdAsync(
        int id, // getirilecek etkinliğin idsini alır
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Events // Events tablosu üzerinde sorgu başlatır
            .Include(eventItem => eventItem.Club) // etkinlikle beraber bağlı olduğu kulüp bilgisini de getirir
            .FirstOrDefaultAsync(eventItem => eventItem.Id == id,cancellationToken);
                 // verilen idye sahip etkinliği arar
                
             // etkinlik bulunursa döndürür, bulunamazsa null döndürür
    }

    public async Task<(List<Event> Items, int TotalCount)> GetPagedAsync(
    string? search,
    string? category,
    int? clubId,
    DateTimeOffset? dateFrom,
    DateTimeOffset? dateTo,
    bool upcomingOnly,
    int page,
    int pageSize,
    CancellationToken cancellationToken = default
)
{
    var query = dbContext.Events
        .AsNoTracking()
        .Include(eventItem => eventItem.Club)
        .AsQueryable();


    if (upcomingOnly)
    {
        query = query.Where(eventItem =>
            eventItem.Status == EventStatus.Active
            &&
            eventItem.StartDate > DateTimeOffset.UtcNow
        );
    }


    if (!string.IsNullOrWhiteSpace(search))
    {
        var searchPattern =
            $"%{search.Trim()}%";


        query = query.Where(eventItem =>
            EF.Functions.ILike(
                eventItem.Title,
                searchPattern
            )
            ||
            EF.Functions.ILike(
                eventItem.Description,
                searchPattern
            )
            ||
            EF.Functions.ILike(
                eventItem.Location,
                searchPattern
            )
        );
    }


    if (!string.IsNullOrWhiteSpace(category))
    {
        var categoryValue =
            category.Trim();


        query = query.Where(eventItem =>
            EF.Functions.ILike(
                eventItem.Category,
                categoryValue
            )
        );
    }


    if (clubId.HasValue)
    {
        query = query.Where(eventItem =>
            eventItem.ClubId == clubId.Value
        );
    }


    if (dateFrom.HasValue)
    {
        var from =
            dateFrom.Value.ToUniversalTime();


        query = query.Where(eventItem =>
            eventItem.StartDate >= from
        );
    }


    if (dateTo.HasValue)
    {
        var to =
            dateTo.Value.ToUniversalTime();


        query = query.Where(eventItem =>
            eventItem.StartDate <= to
        );
    }


    var totalCount =
        await query.CountAsync(
            cancellationToken
        );


    var items =
        await query
            .OrderBy(eventItem =>
                eventItem.StartDate
            )
            .Skip(
                (page - 1) * pageSize
            )
            .Take(pageSize)
            .ToListAsync(
                cancellationToken
            );


    return (
        items,
        totalCount
    );
}


    public async Task AddAsync(
        Event eventItem, // veritabanına eklenecek etkinlik nesnesini alır
        CancellationToken cancellationToken = default
    )
    {
        await dbContext.Events.AddAsync(eventItem, cancellationToken);            
            
         // etkinliği EF Core tarafından eklenmek üzere takip edilen nesnelere ekler, henüz veritabanına kaydetmez
    }



    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) {        
    
   
        return dbContext.SaveChangesAsync(cancellationToken);
        // bekleyen etkinlik ekleme veya güncelleme işlemlerini PostgreSQL veritabanına kaydeder
    }
}