using KampusEtkinlik.Api.DTOs.Events;
using KampusEtkinlik.Api.DTOs.Events;

namespace KampusEtkinlik.Api.Services;

public interface IEventService
{
    Task<IReadOnlyList<PopularEventResponse>> GetPopularAsync(
    int limit,
    CancellationToken cancellationToken = default
    );
    Task<IReadOnlyList<EventResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    );

    Task<EventResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    );

    Task<EventResponse> CreateAsync(
        string managerUserId,
        CreateEventRequest request,
        CancellationToken cancellationToken = default
    );

    Task<EventResponse?> UpdateAsync(
        int id,
        string managerUserId,
        UpdateEventRequest request,
        CancellationToken cancellationToken = default
    );

    Task<EventResponse?> CancelAsync(
        int id,
        string managerUserId,
        CancellationToken cancellationToken = default
    );
}
