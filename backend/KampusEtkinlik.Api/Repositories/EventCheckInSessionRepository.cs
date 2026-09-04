using KampusEtkinlik.Api.Data; // ApplicationDbContext üzerinden veritabanına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // EventCheckInSession modeline erişmemizi sağlar
using Microsoft.EntityFrameworkCore; // AsNoTracking Include Where FirstOrDefaultAsync ve ToListAsync gibi EF Core metotlarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir

public sealed class EventCheckInSessionRepository(ApplicationDbContext dbContext) : IEventCheckInSessionRepository
// qr oturumlarıyla ilgili veritabanı işlemlerini gerçekleştirir
{
    public async Task<EventCheckInSession?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        return await dbContext.EventCheckInSessions
            .AsNoTracking() // veriyi sadece okuyacağımız için EF Corenun bu nesnedeki değişiklikleri takip etmesini engeller
            .Include(session => session.Event) // qr oturumuyla birlikte bağlı olduğu Event bilgisini de getirir
            .FirstOrDefaultAsync(session => session.TokenHash == tokenHash, cancellationToken);
            // verilen token hashine sahip ilk qr oturumunu getirir bulamazsa null döndürür
    }

    public async Task<List<EventCheckInSession>> GetActiveByEventIdAsync(int eventId, CancellationToken cancellationToken = default)
    {
        return await dbContext.EventCheckInSessions
            .Where(session => session.EventId == eventId && session.IsActive) // event idsine ait ve aktif olan qr oturumlarını filtreler
            .ToListAsync(cancellationToken); // filtrelenen qr oturumlarını liste halinde veritabanından getirir
    }

    public async Task AddAsync(EventCheckInSession session, CancellationToken cancellationToken = default)
    {
        await dbContext.EventCheckInSessions.AddAsync(session, cancellationToken);
        // yeni qr oturumunu EF Core tarafından veritabanına eklenecek olarak işaretler
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
        // EF Core tarafından takip edilen ekleme ve güncelleme işlemlerini veritabanına kaydeder
    }
}