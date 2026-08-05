using KampusEtkinlik.Api.DTOs.Registrations;
using KampusEtkinlik.Api.Enums;
using KampusEtkinlik.Api.Models;
using KampusEtkinlik.Api.Repositories;

namespace KampusEtkinlik.Api.Services;

public sealed class RegistrationService(
    IRegistrationRepository registrationRepository,
    IEventRepository eventRepository
) : IRegistrationService
{
    public async Task<RegistrationResponse> RegisterAsync(
        string userId,
        int eventId,
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(
            eventId,
            cancellationToken
        );

        if (eventItem is null)
        {
            throw new KeyNotFoundException(
                "Kayıt olunacak etkinlik bulunamadı."
            );
        }

        if (eventItem.Status == EventStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "İptal edilmiş bir etkinliğe kayıt olunamaz."
            );
        }

        if (eventItem.StartDate <= DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException(
                "Başlamış veya geçmiş bir etkinliğe kayıt olunamaz."
            );
        }

        var existingRegistration =
            await registrationRepository
                .GetByUserAndEventAsync(
                    userId,
                    eventId,
                    cancellationToken
                );

        if (existingRegistration is not null)
        {
            throw new InvalidOperationException(
                "Bu etkinliğe daha önce kayıt oldunuz."
            );
        }

        var approvedCount =
            await registrationRepository
                .CountApprovedByEventAsync(
                    eventId,
                    cancellationToken
                );

        if (approvedCount >= eventItem.Capacity)
        {
            throw new InvalidOperationException(
                "Etkinlik kontenjanı dolmuştur."
            );
        }

        var approvalStatus =
            eventItem.Visibility == EventVisibility.Public
                ? RegistrationApprovalStatus.Approved
                : RegistrationApprovalStatus.Pending;

        var registration = new Registration
        {
            UserId = userId,
            EventId = eventId,
            RegisteredAt = DateTimeOffset.UtcNow,
            ApprovalStatus = approvalStatus
        };

        await registrationRepository.AddAsync(
            registration,
            cancellationToken
        );

        await registrationRepository.SaveChangesAsync(
            cancellationToken
        );

        var createdRegistration =
            await registrationRepository.GetByIdAsync(
                registration.Id,
                cancellationToken
            );

        if (createdRegistration is null)
        {
            throw new InvalidOperationException(
                "Kayıt oluşturuldu ancak tekrar okunamadı."
            );
        }

        return MapToResponse(createdRegistration);
    }

    public async Task<IReadOnlyList<RegistrationResponse>> GetMineAsync(
        string userId,
        CancellationToken cancellationToken = default
    )
    {
        var registrations =
            await registrationRepository.GetByUserIdAsync(
                userId,
                cancellationToken
            );

        return registrations
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<IReadOnlyList<RegistrationResponse>> GetForEventAsync(
        int eventId,
        string managerUserId,
        RegistrationApprovalStatus? approvalStatus = null,
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(
            eventId,
            cancellationToken
        );

        if (eventItem is null)
        {
            throw new KeyNotFoundException(
                "Etkinlik bulunamadı."
            );
        }

        if (eventItem.Club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi kulübünüze ait kayıtları görüntüleyebilirsiniz."
            );
        }

        var registrations =
            await registrationRepository.GetByEventIdAsync(
                eventId,
                approvalStatus,
                cancellationToken
            );

        return registrations
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<RegistrationResponse> ApproveAsync(
        int registrationId,
        string managerUserId,
        CancellationToken cancellationToken = default
    )
    {
        var registration =
            await registrationRepository.GetByIdAsync(
                registrationId,
                cancellationToken
            );

        if (registration is null)
        {
            throw new KeyNotFoundException(
                "Kayıt talebi bulunamadı."
            );
        }

        EnsureManagerOwnsEvent(
            registration,
            managerUserId
        );

        if (registration.ApprovalStatus
            != RegistrationApprovalStatus.Pending)
        {
            throw new InvalidOperationException(
                "Yalnızca bekleyen kayıt talepleri onaylanabilir."
            );
        }

        if (registration.Event.Status
            == EventStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "İptal edilmiş etkinliğin kayıt talebi onaylanamaz."
            );
        }

        var approvedCount =
            await registrationRepository
                .CountApprovedByEventAsync(
                    registration.EventId,
                    cancellationToken
                );

        if (approvedCount >= registration.Event.Capacity)
        {
            throw new InvalidOperationException(
                "Etkinlik kontenjanı dolmuştur."
            );
        }

        registration.ApprovalStatus =
            RegistrationApprovalStatus.Approved;

        await registrationRepository.SaveChangesAsync(
            cancellationToken
        );

        return MapToResponse(registration);
    }

    public async Task<RegistrationResponse> RejectAsync(
        int registrationId,
        string managerUserId,
        CancellationToken cancellationToken = default
    )
    {
        var registration =
            await registrationRepository.GetByIdAsync(
                registrationId,
                cancellationToken
            );

        if (registration is null)
        {
            throw new KeyNotFoundException(
                "Kayıt talebi bulunamadı."
            );
        }

        EnsureManagerOwnsEvent(
            registration,
            managerUserId
        );

        if (registration.ApprovalStatus
            != RegistrationApprovalStatus.Pending)
        {
            throw new InvalidOperationException(
                "Yalnızca bekleyen kayıt talepleri reddedilebilir."
            );
        }

        registration.ApprovalStatus =
            RegistrationApprovalStatus.Rejected;

        await registrationRepository.SaveChangesAsync(
            cancellationToken
        );

        return MapToResponse(registration);
    }

    private static void EnsureManagerOwnsEvent(
        Registration registration,
        string managerUserId
    )
    {
        if (registration.Event.Club.ManagerUserId
            != managerUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi kulübünüze ait kayıt taleplerini yönetebilirsiniz."
            );
        }
    }

    private static RegistrationResponse MapToResponse(
        Registration registration
    )
    {
        return new RegistrationResponse
        {
            Id = registration.Id,
            UserId = registration.UserId,
            UserFullName =
                registration.User?.FullName
                ?? string.Empty,
            EventId = registration.EventId,
            EventTitle =
                registration.Event?.Title
                ?? string.Empty,
            ClubName =
                registration.Event?.Club?.Name
                ?? string.Empty,
            RegisteredAt = registration.RegisteredAt,
            ApprovalStatus = registration.ApprovalStatus
        };
    }
}