using KampusEtkinlik.Api.Enums; // RegistrationApprovalStatus enumuna erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Registration modeline erişmemizi sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir

public interface IRegistrationRepository // etkinlik kayıtlarıyla ilgili veritabanı işlemlerinin sözleşmesini tanımlar
{
    Task<Registration?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    // kayıt işlemini idsine göre getirir bulunamazsa null döner

    Task<Registration?> GetByUserAndEventAsync(string userId, int eventId, CancellationToken cancellationToken = default);
    // kullanıcının belirtilen etkinliğe daha önce kayıt olup olmadığını getirir yoksa null döner

    Task<Registration?> GetByUserAndEventForUpdateAsync(string userId, int eventId, CancellationToken cancellationToken = default);
    // qr check-in sırasında kullanıcının kaydını değişiklik yapılabilecek şekilde getirir

    Task<List<Registration>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    // kullanıcının yaptığı bütün etkinlik kayıtlarını liste halinde getirir

    Task<List<Registration>> GetByEventIdAsync(int eventId, RegistrationApprovalStatus? approvalStatus = null, CancellationToken cancellationToken = default);
    // etkinliğe yapılan kayıtları getirir approvalStatus verilirse kayıt durumuna göre filtreler

    Task<int> CountApprovedByEventAsync(int eventId, CancellationToken cancellationToken = default);
    // etkinliğin Approved durumundaki kayıt sayısını getirir

    Task AddAsync(Registration registration, CancellationToken cancellationToken = default);
    // yeni etkinlik kaydını EF Core tarafından eklenmek üzere hazırlar

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    // kayıt üzerindeki ekleme veya değişiklikleri veritabanına kaydeder
}