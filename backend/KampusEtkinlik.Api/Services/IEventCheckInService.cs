using KampusEtkinlik.Api.DTOs.CheckIn; // check-in işlemlerinde kullanılan request ve response DTOlarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir

public interface IEventCheckInService // qr oluşturma ve qr ile check-in işlemlerinin servis sözleşmesini tanımlar
{
    Task<CheckInSessionResponse> CreateSessionAsync(int eventId, string managerUserId, int expiresInMinutes, CancellationToken cancellationToken = default);
    // clubmanager için belirtilen etkinliğe geçici qr oturumu oluşturur ve token bilgisini döndürür

    Task<CheckInResponse> CheckInAsync(string userId, string token, bool isClubManager, CancellationToken cancellationToken = default);
    // student veya clubmanagerın qr tokenını doğrulayıp etkinliğe katılım zamanını kaydeder
}