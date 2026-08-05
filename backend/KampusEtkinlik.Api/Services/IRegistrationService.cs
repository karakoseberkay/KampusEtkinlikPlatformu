using KampusEtkinlik.Api.DTOs.Registrations;
using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.Services;

public interface IRegistrationService
{
    Task<RegistrationResponse> RegisterAsync(
        string userId,
        int eventId,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<RegistrationResponse>> GetMineAsync(
        string userId,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<RegistrationResponse>> GetForEventAsync(
        int eventId,
        string managerUserId,
        RegistrationApprovalStatus? approvalStatus = null,
        CancellationToken cancellationToken = default
    );

    Task<RegistrationResponse> ApproveAsync(
        int registrationId,
        string managerUserId,
        CancellationToken cancellationToken = default
    );

    Task<RegistrationResponse> RejectAsync(
        int registrationId,
        string managerUserId,
        CancellationToken cancellationToken = default
    );
}