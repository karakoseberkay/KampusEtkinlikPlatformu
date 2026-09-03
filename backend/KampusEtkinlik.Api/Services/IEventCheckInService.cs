using KampusEtkinlik.Api.DTOs.CheckIn;

namespace KampusEtkinlik.Api.Services;


public interface IEventCheckInService
{
    Task<CheckInSessionResponse> CreateSessionAsync(
        int eventId,
        string managerUserId,
        int expiresInMinutes,
        CancellationToken cancellationToken = default
    );
    // clubmanager için etkinliğe geçici qr oturumu oluşturur


    Task<CheckInResponse> CheckInAsync(
        string userId,
        string token,
        bool isClubManager,
        CancellationToken cancellationToken = default
    );
    // student veya clubmanagerın qr tokenını kullanarak etkinliğe katılımını kaydeder
}