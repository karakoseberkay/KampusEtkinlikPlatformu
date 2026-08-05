using KampusEtkinlik.Api.Data;
using KampusEtkinlik.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace KampusEtkinlik.Api.Repositories;

public sealed class ClubRepository(
    ApplicationDbContext dbContext
) : IClubRepository
{
    public async Task<List<Club>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Clubs
            .AsNoTracking()
            .Include(club => club.ManagerUser)
            .Include(club => club.Events)
            .OrderBy(club => club.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Club?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Clubs
            .Include(club => club.ManagerUser)
            .Include(club => club.Events)
            .FirstOrDefaultAsync(
                club => club.Id == id,
                cancellationToken
            );
    }

    public async Task<Club?> GetByIdWithStatsAsync(
    int id,
    CancellationToken cancellationToken = default
)
{
    return await dbContext.Clubs
        .AsNoTracking()
        .Include(club => club.Events)
            .ThenInclude(eventItem => eventItem.Registrations)
        .FirstOrDefaultAsync(
            club => club.Id == id,
            cancellationToken
        );
}

    public async Task<bool> NameExistsAsync(
        string name,
        int? excludedClubId = null,
        CancellationToken cancellationToken = default
    )
    {
        var normalizedName = name
            .Trim()
            .ToLower();

        return await dbContext.Clubs.AnyAsync(
            club =>
                club.Name.ToLower() == normalizedName
                && (
                    !excludedClubId.HasValue
                    || club.Id != excludedClubId.Value
                ),
            cancellationToken
        );
    }

    public async Task AddAsync(
        Club club,
        CancellationToken cancellationToken = default
    )
    {
        await dbContext.Clubs.AddAsync(
            club,
            cancellationToken
        );
    }

    public void Remove(Club club)
    {
        dbContext.Clubs.Remove(club);
    }

    public Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    )
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}