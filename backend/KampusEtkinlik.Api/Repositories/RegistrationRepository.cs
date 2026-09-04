using KampusEtkinlik.Api.Data; // ApplicationDbContext üzerinden veritabanına erişmemizi sağlar
using KampusEtkinlik.Api.Enums; // RegistrationApprovalStatus enumuna erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Registration modeline erişmemizi sağlar
using Microsoft.EntityFrameworkCore; // Include Where CountAsync AsNoTracking gibi EF Core metotlarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir

public sealed class RegistrationRepository(ApplicationDbContext dbContext) : IRegistrationRepository
// kayıt veritabanı işlemlerini yapacağımız DbContexti DI üzerinden alır ve interface içindeki işlemleri gerçekleştirir
{
    public async Task<Registration?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Registrations // Registrations tablosu üzerinde sorgu başlatır
            .Include(registration => registration.User) // Registration ile bağlantılı kullanıcı bilgisini de sorguya dahil eder
            .Include(registration => registration.Event) // Registration ile bağlantılı etkinlik bilgisini de sorguya dahil eder
            .ThenInclude(eventItem => eventItem.Club) // Eventin içindeki bağlı Club bilgisini de sorguya dahil eder
            .FirstOrDefaultAsync(registration => registration.Id == id, cancellationToken);
            // verilen idye sahip ilk kaydı getirir bulamazsa null döndürür
    }

    public async Task<Registration?> GetByUserAndEventAsync(string userId, int eventId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Registrations
            .AsNoTracking() // kayıt sadece okunacağı için EF Coreun bu nesnedeki değişiklikleri takip etmesini engeller
            .FirstOrDefaultAsync(
                registration => registration.UserId == userId && registration.EventId == eventId,
                cancellationToken
            ); // aynı kullanıcı ve etkinliğe ait kayıt varsa getirir yoksa null döndürür
    }

    public async Task<Registration?> GetByUserAndEventForUpdateAsync(string userId, int eventId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Registrations
            .Include(registration => registration.Event) // check-in sırasında etkinlik bilgisine de ulaşmamızı sağlar
            .FirstOrDefaultAsync(
                registration => registration.UserId == userId && registration.EventId == eventId,
                cancellationToken
            ); // kayıt üzerinde CheckedInAt değişeceği için AsNoTracking kullanmadan takipli olarak getirir
    }

    public async Task<List<Registration>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Registrations
            .AsNoTracking() // kayıtlar sadece okunacağı için değişiklik takibini kapatır
            .Include(registration => registration.User) // kayıtla beraber kullanıcı bilgisini getirir
            .Include(registration => registration.Event) // kayıtla beraber etkinlik bilgisini getirir
            .ThenInclude(eventItem => eventItem.Club) // etkinliğin bağlı olduğu kulüp bilgisini de getirir
            .Where(registration => registration.UserId == userId) // sadece verilen kullanıcıya ait kayıtları filtreler
            .OrderByDescending(registration => registration.RegisteredAt) // kayıtları en yeni tarihten en eski tarihe doğru sıralar
            .ToListAsync(cancellationToken); // oluşan sorguyu çalıştırır ve sonuçları liste halinde getirir
    }

    public async Task<List<Registration>> GetByEventIdAsync(int eventId, RegistrationApprovalStatus? approvalStatus = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Registrations
            .AsNoTracking() // kayıtlar sadece okunacağı için değişiklik takibini kapatır
            .Include(registration => registration.User) // kayıt olan kullanıcının bilgisini de getirir
            .Include(registration => registration.Event) // kayıt olunan etkinliğin bilgisini de getirir
            .ThenInclude(eventItem => eventItem.Club) // etkinliğin bağlı olduğu kulüp bilgisini de getirir
            .Where(registration => registration.EventId == eventId); // sadece verilen etkinliğe ait kayıtları filtreler

        if (approvalStatus.HasValue) // approvalStatus null değilse filtre uygulanacağını kontrol eder
        {
            query = query.Where(registration => registration.ApprovalStatus == approvalStatus.Value);
            // HasValue true olduğu için Value ile Pending Approved veya Rejected değerine ulaşıp filtreler
        }

        return await query
            .OrderBy(registration => registration.ApprovalStatus) // kayıtları önce onay durumuna göre sıralar
            .ThenBy(registration => registration.RegisteredAt) // aynı onay durumundaki kayıtları kayıt tarihine göre sıralar
            .ToListAsync(cancellationToken); // hazırlanan sorguyu çalıştırıp sonucu liste olarak getirir
    }

    public Task<int> CountApprovedByEventAsync(int eventId, CancellationToken cancellationToken = default)
    {
        return dbContext.Registrations.CountAsync(
            registration => registration.EventId == eventId &&
                            registration.ApprovalStatus == RegistrationApprovalStatus.Approved,
            cancellationToken
        ); // verilen etkinliğin sadece Approved durumundaki kayıtlarını veritabanında sayar
    }

    public async Task AddAsync(Registration registration, CancellationToken cancellationToken = default)
    {
        await dbContext.Registrations.AddAsync(registration, cancellationToken);
        // yeni kaydı EF Core tarafında eklenecek olarak işaretler henüz veritabanına yazmaz
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
        // EF Core tarafından takip edilen ekleme ve değişiklikleri PostgreSQL veritabanına kaydeder
    }
}