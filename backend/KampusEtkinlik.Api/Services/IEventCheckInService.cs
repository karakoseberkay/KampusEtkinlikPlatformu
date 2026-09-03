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
        CancellationToken cancellationToken = default
    );
    // studentın qr tokenını kullanarak etkinliğe katılımını kaydeder
}