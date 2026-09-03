using KampusEtkinlik.Api.Models;
// EventCheckInSession modeline erişmemizi sağlar

namespace KampusEtkinlik.Api.Repositories;
// bu dosyanın Repositories katmanına ait olduğunu belirtir


public interface IEventCheckInSessionRepository
// qr oturumlarıyla ilgili veritabanı işlemlerinin sözleşmesini tanımlar
{
    Task<EventCheckInSession?> GetByTokenHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default
    );
    // token hash değerine ait qr oturumunu getirir


    Task<List<EventCheckInSession>> GetActiveByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken = default
    );
    // etkinliğe ait aktif qr oturumlarını getirir


    Task AddAsync(
        EventCheckInSession session,
        CancellationToken cancellationToken = default
    );
    // yeni qr oturumunu eklenmek üzere hazırlar


    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    );
    // qr oturumundaki değişiklikleri veritabanına kaydeder
}