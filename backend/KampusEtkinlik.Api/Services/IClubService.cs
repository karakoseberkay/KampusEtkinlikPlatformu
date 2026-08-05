using KampusEtkinlik.Api.DTOs.Clubs;

namespace KampusEtkinlik.Api.Services;

public interface IClubService
{

    Task<ClubStatsResponse?> GetStatsAsync(
    int id,
    string managerUserId,
    CancellationToken cancellationToken = default
);
    Task<IReadOnlyList<ClubResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    );

    Task<ClubResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    );

    Task<ClubResponse> CreateAsync(
        string managerUserId,
        CreateClubRequest request,
        CancellationToken cancellationToken = default
    );

    Task<ClubResponse?> UpdateAsync(
        int id,
        string managerUserId,
        UpdateClubRequest request,
        CancellationToken cancellationToken = default
    );

    Task<bool> DeleteAsync(
        int id,
        string managerUserId,
        CancellationToken cancellationToken = default
    );
}