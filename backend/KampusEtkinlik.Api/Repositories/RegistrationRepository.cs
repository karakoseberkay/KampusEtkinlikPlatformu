using KampusEtkinlik.Api.Data;
using KampusEtkinlik.Api.Enums;
using KampusEtkinlik.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace KampusEtkinlik.Api.Repositories;

public sealed class RegistrationRepository(
    ApplicationDbContext dbContext
) : IRegistrationRepository
{
    public async Task<Registration?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Registrations
            .Include(registration => registration.User)
            .Include(registration => registration.Event)
                .ThenInclude(eventItem => eventItem.Club)
            .FirstOrDefaultAsync(
                registration => registration.Id == id,
                cancellationToken
            );
    }

    public async Task<Registration?> GetByUserAndEventAsync(
        string userId,
        int eventId,
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Registrations
            .AsNoTracking()
            .FirstOrDefaultAsync(
                registration =>
                    registration.UserId == userId
                    && registration.EventId == eventId,
                cancellationToken
            );
    }

    public async Task<List<Registration>> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Registrations
            .AsNoTracking()
            .Include(registration => registration.User)
            .Include(registration => registration.Event)
                .ThenInclude(eventItem => eventItem.Club)
            .Where(registration =>
                registration.UserId == userId
            )
            .OrderByDescending(registration =>
                registration.RegisteredAt
            )
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Registration>> GetByEventIdAsync(
        int eventId,
        RegistrationApprovalStatus? approvalStatus = null,
        CancellationToken cancellationToken = default
    )
    {
        var query = dbContext.Registrations
            .AsNoTracking()
            .Include(registration => registration.User)
            .Include(registration => registration.Event)
                .ThenInclude(eventItem => eventItem.Club)
            .Where(registration =>
                registration.EventId == eventId
            );

        if (approvalStatus.HasValue)
        {
            query = query.Where(registration =>
                registration.ApprovalStatus
                == approvalStatus.Value
            );
        }

        return await query
            .OrderBy(registration =>
                registration.ApprovalStatus
            )
            .ThenBy(registration =>
                registration.RegisteredAt
            )
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountApprovedByEventAsync(
        int eventId,
        CancellationToken cancellationToken = default
    )
    {
        return dbContext.Registrations.CountAsync(
            registration =>
                registration.EventId == eventId
                && registration.ApprovalStatus
                    == RegistrationApprovalStatus.Approved,
            cancellationToken
        );
    }

    public async Task AddAsync(
        Registration registration,
        CancellationToken cancellationToken = default
    )
    {
        await dbContext.Registrations.AddAsync(
            registration,
            cancellationToken
        );
    }

    public Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    )
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}