using KampusEtkinlik.Api.Models;

namespace KampusEtkinlik.Api.Repositories;

public interface IClubRepository
{
    Task<Club?> GetByIdWithStatsAsync(
    int id,
    CancellationToken cancellationToken = default
);
    Task<List<Club>> GetAllAsync(
        CancellationToken cancellationToken = default
    );

    Task<Club?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    );

    Task<bool> NameExistsAsync(
        string name,
        int? excludedClubId = null,
        CancellationToken cancellationToken = default
    );

    Task AddAsync(
        Club club,
        CancellationToken cancellationToken = default
    );

    void Remove(Club club);

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    );
}