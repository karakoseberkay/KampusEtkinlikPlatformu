using KampusEtkinlik.Api.Enums;
using KampusEtkinlik.Api.Models;

namespace KampusEtkinlik.Api.Repositories;

public interface IRegistrationRepository
{
    Task<Registration?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    );

    Task<Registration?> GetByUserAndEventAsync(
        string userId,
        int eventId,
        CancellationToken cancellationToken = default
    );

    Task<List<Registration>> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken = default
    );

    Task<List<Registration>> GetByEventIdAsync(
        int eventId,
        RegistrationApprovalStatus? approvalStatus = null,
        CancellationToken cancellationToken = default
    );

    Task<int> CountApprovedByEventAsync(
        int eventId,
        CancellationToken cancellationToken = default
    );

    Task AddAsync(
        Registration registration,
        CancellationToken cancellationToken = default
    );

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    );
}