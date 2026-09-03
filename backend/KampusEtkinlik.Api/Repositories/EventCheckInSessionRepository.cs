using KampusEtkinlik.Api.Data;
// ApplicationDbContext üzerinden veritabanına erişmemizi sağlar

using KampusEtkinlik.Api.Models;
// EventCheckInSession modeline erişmemizi sağlar

using Microsoft.EntityFrameworkCore;
// Include Where ve FirstOrDefaultAsync gibi EF Core metotlarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Repositories;
// bu dosyanın Repositories katmanına ait olduğunu belirtir


public sealed class EventCheckInSessionRepository(
    ApplicationDbContext dbContext
) : IEventCheckInSessionRepository
// qr oturumlarıyla ilgili veritabanı işlemlerini gerçekleştirir
{
    public async Task<EventCheckInSession?> GetByTokenHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.EventCheckInSessions
            .AsNoTracking()
            .Include(session => session.Event)
            .FirstOrDefaultAsync(
                session => session.TokenHash == tokenHash,
                cancellationToken
            );
        // qr tokenının hash değerine ait oturumu ve etkinliği getirir
    }


    public async Task<List<EventCheckInSession>> GetActiveByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.EventCheckInSessions
            .Where(session =>
                session.EventId == eventId &&
                session.IsActive
            )
            .ToListAsync(cancellationToken);
        // etkinliğe ait aktif qr oturumlarını değiştirilebilir şekilde getirir
    }


    public async Task AddAsync(
        EventCheckInSession session,
        CancellationToken cancellationToken = default
    )
    {
        await dbContext.EventCheckInSessions.AddAsync(
            session,
            cancellationToken
        );
        // yeni qr oturumunu eklenmek üzere hazırlar
    }


    public Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    )
    {
        return dbContext.SaveChangesAsync(cancellationToken);
        // qr oturumundaki değişiklikleri veritabanına kaydeder
    }
}