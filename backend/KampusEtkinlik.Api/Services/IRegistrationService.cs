using KampusEtkinlik.Api.DTOs.Registrations;
using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.Services;

public interface IRegistrationService // etkinlik kayıtlarıyla ilgili iş kurallarının hangi işlemleri yapacağını belirleyen servis sözleşmesidir
{
    Task<RegistrationResponse> RegisterAsync(
        string userId, // etkinliğe kayıt olacak kullanıcının idsini alır
        int eventId, // kullanıcının kayıt olmak istediği etkinliğin idsini alır
        CancellationToken cancellationToken = default
    ); // kullanıcıyı etkinliğe kaydeder ve oluşan kayıt bilgisini döndürür


    Task<IReadOnlyList<RegistrationResponse>> GetMineAsync(
        string userId, // kayıtları getirilecek giriş yapmış kullanıcının idsini alır
        CancellationToken cancellationToken = default
    ); // kullanıcının kendi etkinlik kayıtlarını frontend'e uygun response listesi olarak getirir


    Task<IReadOnlyList<RegistrationResponse>> GetForEventAsync(
        int eventId, // kayıtları görüntülenecek etkinliğin idsini alır
        string managerUserId, // işlemi yapan kulüp yöneticisinin kullanıcı idsini alır
        RegistrationApprovalStatus? approvalStatus = null, // istersek kayıtları Pending Approved veya Rejected durumuna göre filtreler
        CancellationToken cancellationToken = default
    ); // belirtilen etkinliğin kayıtlarını getirir


    Task<RegistrationResponse> ApproveAsync(
        int registrationId, // onaylanacak kayıt işleminin idsini alır
        string managerUserId, // onay işlemini yapan kulüp yöneticisinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    ); // kayıt isteğini onaylar ve güncellenmiş kayıt bilgisini döndürür


    Task<RegistrationResponse> RejectAsync(
        int registrationId, // reddedilecek kayıt işleminin idsini alır
        string managerUserId, // red işlemini yapan kulüp yöneticisinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    ); // kayıt isteğini reddeder ve güncellenmiş kayıt bilgisini döndürür
}