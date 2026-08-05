using KampusEtkinlik.Api.DTOs.Events;
using KampusEtkinlik.Api.Enums;
using KampusEtkinlik.Api.Models;
using KampusEtkinlik.Api.Repositories;

namespace KampusEtkinlik.Api.Services;

public sealed class EventService(
    IEventRepository eventRepository,
    IClubRepository clubRepository
) : IEventService
{
    public async Task<IReadOnlyList<EventResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var events = await eventRepository.GetAllAsync(
            cancellationToken
        );

        return events
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<IReadOnlyList<PopularEventResponse>> GetPopularAsync(
    int limit,
    CancellationToken cancellationToken = default
)
{
    var safeLimit = Math.Clamp(limit, 1, 50);

    var events = await eventRepository.GetPopularAsync(
        safeLimit,
        cancellationToken
    );

    return events
        .Select(MapToPopularResponse)
        .ToList();
}

    public async Task<EventResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(
            id,
            cancellationToken
        );

        return eventItem is null
            ? null
            : MapToResponse(eventItem);
    }

    public async Task<EventResponse> CreateAsync(
        string managerUserId,
        CreateEventRequest request,
        CancellationToken cancellationToken = default
    )
    {
        ValidateRequest(
            request.Title,
            request.Description,
            request.StartDate,
            request.Location,
            request.Capacity,
            request.Category,
            request.Visibility
        );

        var club = await clubRepository.GetByIdAsync(
            request.ClubId,
            cancellationToken
        );

        if (club is null)
        {
            throw new KeyNotFoundException(
                "Etkinliğin bağlanacağı kulüp bulunamadı."
            );
        }

        if (club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca yönettiğiniz kulübe etkinlik ekleyebilirsiniz."
            );
        }

        var eventItem = new Event
        {
            ClubId = request.ClubId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            StartDate = request.StartDate.ToUniversalTime(),
            Location = request.Location.Trim(),
            Capacity = request.Capacity,
            Category = request.Category.Trim(),
            Visibility = request.Visibility,
            Status = EventStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await eventRepository.AddAsync(
            eventItem,
            cancellationToken
        );

        await eventRepository.SaveChangesAsync(
            cancellationToken
        );

        var createdEvent =
            await eventRepository.GetByIdAsync(
                eventItem.Id,
                cancellationToken
            );

        if (createdEvent is null)
        {
            throw new InvalidOperationException(
                "Etkinlik oluşturuldu ancak tekrar okunamadı."
            );
        }

        return MapToResponse(createdEvent);
    }

    public async Task<EventResponse?> UpdateAsync(
        int id,
        string managerUserId,
        UpdateEventRequest request,
        CancellationToken cancellationToken = default
    )
    {
        ValidateRequest(
            request.Title,
            request.Description,
            request.StartDate,
            request.Location,
            request.Capacity,
            request.Category,
            request.Visibility
        );

        var eventItem = await eventRepository.GetByIdAsync(
            id,
            cancellationToken
        );

        if (eventItem is null)
        {
            return null;
        }

        if (eventItem.Club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi kulübünüze ait etkinliği güncelleyebilirsiniz."
            );
        }

        if (eventItem.Status == EventStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "İptal edilmiş bir etkinlik güncellenemez."
            );
        }

        eventItem.Title = request.Title.Trim();
        eventItem.Description = request.Description.Trim();
        eventItem.StartDate = request.StartDate.ToUniversalTime();
        eventItem.Location = request.Location.Trim();
        eventItem.Capacity = request.Capacity;
        eventItem.Category = request.Category.Trim();
        eventItem.Visibility = request.Visibility;

        await eventRepository.SaveChangesAsync(
            cancellationToken
        );

        return MapToResponse(eventItem);
    }

    public async Task<EventResponse?> CancelAsync(
        int id,
        string managerUserId,
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(
            id,
            cancellationToken
        );

        if (eventItem is null)
        {
            return null;
        }

        if (eventItem.Club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi kulübünüze ait etkinliği iptal edebilirsiniz."
            );
        }

        if (eventItem.Status == EventStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "Etkinlik zaten iptal edilmiş."
            );
        }

        eventItem.Status = EventStatus.Cancelled;

        await eventRepository.SaveChangesAsync(
            cancellationToken
        );

        return MapToResponse(eventItem);
    }

    private static void ValidateRequest(
        string title,
        string description,
        DateTimeOffset startDate,
        string location,
        int capacity,
        string category,
        EventVisibility visibility
    )
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException(
                "Etkinlik başlığı boş bırakılamaz."
            );
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException(
                "Etkinlik açıklaması boş bırakılamaz."
            );
        }

        if (string.IsNullOrWhiteSpace(location))
        {
            throw new ArgumentException(
                "Etkinlik konumu boş bırakılamaz."
            );
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            throw new ArgumentException(
                "Etkinlik kategorisi boş bırakılamaz."
            );
        }

        if (capacity <= 0)
        {
            throw new ArgumentException(
                "Etkinlik kontenjanı sıfırdan büyük olmalıdır."
            );
        }

        if (startDate.ToUniversalTime() <= DateTimeOffset.UtcNow)
        {
            throw new ArgumentException(
                "Etkinlik tarihi gelecekte olmalıdır."
            );
        }

        if (!Enum.IsDefined(visibility))
        {
            throw new ArgumentException(
                "Geçersiz etkinlik görünürlüğü."
            );
        }
    }

    private static EventResponse MapToResponse(
        Event eventItem
    )
    {
        return new EventResponse
        {
            Id = eventItem.Id,
            ClubId = eventItem.ClubId,
            ClubName = eventItem.Club?.Name ?? string.Empty,
            Title = eventItem.Title,
            Description = eventItem.Description,
            StartDate = eventItem.StartDate,
            Location = eventItem.Location,
            Capacity = eventItem.Capacity,
            Category = eventItem.Category,
            Visibility = eventItem.Visibility,
            Status = eventItem.Status,
            CreatedAt = eventItem.CreatedAt
        };
    }

    private static PopularEventResponse MapToPopularResponse(
    Event eventItem
)
{
    var approvedRegistrationCount =
        eventItem.Registrations.Count(registration =>
            registration.ApprovalStatus
            == RegistrationApprovalStatus.Approved
        );

    var remainingCapacity = Math.Max(
        eventItem.Capacity - approvedRegistrationCount,
        0
    );

    var registrationRate =
        eventItem.Capacity > 0
            ? Math.Round(
                approvedRegistrationCount
                * 100.0
                / eventItem.Capacity,
                2
            )
            : 0;

    return new PopularEventResponse
    {
        Id = eventItem.Id,
        ClubId = eventItem.ClubId,
        ClubName = eventItem.Club?.Name ?? string.Empty,
        Title = eventItem.Title,
        StartDate = eventItem.StartDate,
        Location = eventItem.Location,
        Category = eventItem.Category,
        Visibility = eventItem.Visibility,
        Capacity = eventItem.Capacity,
        ApprovedRegistrationCount =
            approvedRegistrationCount,
        RemainingCapacity = remainingCapacity,
        RegistrationRate = registrationRate
    };
}
}