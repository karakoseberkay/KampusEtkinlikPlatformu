using KampusEtkinlik.Api.DTOs.Clubs;
using KampusEtkinlik.Api.Models;
using KampusEtkinlik.Api.Repositories;
using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.Services;

public sealed class ClubService(
    IClubRepository clubRepository
) : IClubService
{
    public async Task<IReadOnlyList<ClubResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var clubs = await clubRepository.GetAllAsync(
            cancellationToken
        );

        return clubs
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<ClubResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        var club = await clubRepository.GetByIdAsync(
            id,
            cancellationToken
        );

        return club is null
            ? null
            : MapToResponse(club);
    }

    public async Task<ClubStatsResponse?> GetStatsAsync(
    int id,
    string managerUserId,
    CancellationToken cancellationToken = default
)
{
    var club = await clubRepository.GetByIdWithStatsAsync(
        id,
        cancellationToken
    );

    if (club is null)
    {
        return null;
    }

    if (club.ManagerUserId != managerUserId)
    {
        throw new UnauthorizedAccessException(
            "Yalnızca kendi yönettiğiniz kulübün istatistiklerini görüntüleyebilirsiniz."
        );
    }

    var eventStats = club.Events
        .OrderByDescending(eventItem => eventItem.StartDate)
        .Select(eventItem =>
        {
            var approvedCount =
                eventItem.Registrations.Count(registration =>
                    registration.ApprovalStatus
                    == RegistrationApprovalStatus.Approved
                );

            var pendingCount =
                eventItem.Registrations.Count(registration =>
                    registration.ApprovalStatus
                    == RegistrationApprovalStatus.Pending
                );

            var rejectedCount =
                eventItem.Registrations.Count(registration =>
                    registration.ApprovalStatus
                    == RegistrationApprovalStatus.Rejected
                );

            var registrationRate =
                eventItem.Capacity > 0
                    ? Math.Round(
                        approvedCount * 100.0 / eventItem.Capacity,
                        2
                    )
                    : 0;

            return new ClubEventStatsResponse
            {
                EventId = eventItem.Id,
                Title = eventItem.Title,
                StartDate = eventItem.StartDate,
                Status = eventItem.Status,
                Capacity = eventItem.Capacity,
                ApprovedRegistrationCount = approvedCount,
                PendingRegistrationCount = pendingCount,
                RejectedRegistrationCount = rejectedCount,
                RegistrationRate = registrationRate
            };
        })
        .ToList();

    var totalCapacity = club.Events.Sum(
        eventItem => eventItem.Capacity
    );

    var totalApprovedCount = eventStats.Sum(
        eventItem => eventItem.ApprovedRegistrationCount
    );

    var overallRegistrationRate =
        totalCapacity > 0
            ? Math.Round(
                totalApprovedCount * 100.0 / totalCapacity,
                2
            )
            : 0;

    return new ClubStatsResponse
    {
        ClubId = club.Id,
        ClubName = club.Name,

        TotalEventCount = club.Events.Count,

        ActiveEventCount = club.Events.Count(eventItem =>
            eventItem.Status == EventStatus.Active
        ),

        CancelledEventCount = club.Events.Count(eventItem =>
            eventItem.Status == EventStatus.Cancelled
        ),

        TotalApprovedRegistrationCount = totalApprovedCount,

        TotalPendingRegistrationCount = eventStats.Sum(
            eventItem => eventItem.PendingRegistrationCount
        ),

        TotalRejectedRegistrationCount = eventStats.Sum(
            eventItem => eventItem.RejectedRegistrationCount
        ),

        OverallRegistrationRate = overallRegistrationRate,

        Events = eventStats
    };
}


    public async Task<ClubResponse> CreateAsync(
        string managerUserId,
        CreateClubRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var clubName = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(clubName))
        {
            throw new ArgumentException(
                "Kulüp adı boş bırakılamaz."
            );
        }

        var nameExists =
            await clubRepository.NameExistsAsync(
                clubName,
                cancellationToken: cancellationToken
            );

        if (nameExists)
        {
            throw new InvalidOperationException(
                "Bu isimde bir kulüp zaten bulunuyor."
            );
        }

        var club = new Club
        {
            Name = clubName,
            Description = NormalizeOptionalText(
                request.Description
            ),
            LogoUrl = NormalizeOptionalText(
                request.LogoUrl
            ),
            ManagerUserId = managerUserId
        };

        await clubRepository.AddAsync(
            club,
            cancellationToken
        );

        await clubRepository.SaveChangesAsync(
            cancellationToken
        );

        var createdClub =
            await clubRepository.GetByIdAsync(
                club.Id,
                cancellationToken
            );

        if (createdClub is null)
        {
            throw new InvalidOperationException(
                "Kulüp oluşturuldu ancak tekrar okunamadı."
            );
        }

        return MapToResponse(createdClub);
    }

    public async Task<ClubResponse?> UpdateAsync(
        int id,
        string managerUserId,
        UpdateClubRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var club = await clubRepository.GetByIdAsync(
            id,
            cancellationToken
        );

        if (club is null)
        {
            return null;
        }

        if (club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi yönettiğiniz kulübü güncelleyebilirsiniz."
            );
        }

        var clubName = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(clubName))
        {
            throw new ArgumentException(
                "Kulüp adı boş bırakılamaz."
            );
        }

        var nameExists =
            await clubRepository.NameExistsAsync(
                clubName,
                club.Id,
                cancellationToken
            );

        if (nameExists)
        {
            throw new InvalidOperationException(
                "Bu isimde başka bir kulüp zaten bulunuyor."
            );
        }

        club.Name = clubName;
        club.Description = NormalizeOptionalText(
            request.Description
        );
        club.LogoUrl = NormalizeOptionalText(
            request.LogoUrl
        );

        await clubRepository.SaveChangesAsync(
            cancellationToken
        );

        return MapToResponse(club);
    }

    public async Task<bool> DeleteAsync(
        int id,
        string managerUserId,
        CancellationToken cancellationToken = default
    )
    {
        var club = await clubRepository.GetByIdAsync(
            id,
            cancellationToken
        );

        if (club is null)
        {
            return false;
        }

        if (club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi yönettiğiniz kulübü silebilirsiniz."
            );
        }

        if (club.Events.Count > 0)
        {
            throw new InvalidOperationException(
                "Etkinliği bulunan bir kulüp silinemez."
            );
        }

        clubRepository.Remove(club);

        await clubRepository.SaveChangesAsync(
            cancellationToken
        );

        return true;
    }

    private static ClubResponse MapToResponse(Club club)
    {
        return new ClubResponse
        {
            Id = club.Id,
            Name = club.Name,
            Description = club.Description,
            LogoUrl = club.LogoUrl,
            ManagerUserId = club.ManagerUserId,
            ManagerFullName =
                club.ManagerUser?.FullName
                ?? string.Empty,
            EventCount = club.Events.Count
        };
    }

    private static string? NormalizeOptionalText(
        string? value
    )
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}