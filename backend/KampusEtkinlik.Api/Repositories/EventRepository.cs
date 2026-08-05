using KampusEtkinlik.Api.Data;
using KampusEtkinlik.Api.Models;
using Microsoft.EntityFrameworkCore;
using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.Repositories;

public sealed class EventRepository(
    ApplicationDbContext dbContext
) : IEventRepository
{
    public async Task<List<Event>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Events
            .AsNoTracking()
            .Include(eventItem => eventItem.Club)
            .OrderBy(eventItem => eventItem.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Event>> GetPopularAsync(
    int limit,
    CancellationToken cancellationToken = default
)
{
    return await dbContext.Events
        .AsNoTracking()
        .Include(eventItem => eventItem.Club)
        .Include(eventItem => eventItem.Registrations)
        .Where(eventItem =>
            eventItem.Status == EventStatus.Active
            && eventItem.StartDate > DateTimeOffset.UtcNow
        )
        .OrderByDescending(eventItem =>
            eventItem.Registrations.Count(registration =>
                registration.ApprovalStatus
                == RegistrationApprovalStatus.Approved
            )
        )
        .ThenBy(eventItem => eventItem.StartDate)
        .Take(limit)
        .ToListAsync(cancellationToken);
}
    public async Task<Event?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Events
            .Include(eventItem => eventItem.Club)
            .FirstOrDefaultAsync(
                eventItem => eventItem.Id == id,
                cancellationToken
            );
    }

    public async Task AddAsync(
        Event eventItem,
        CancellationToken cancellationToken = default
    )
    {
        await dbContext.Events.AddAsync(
            eventItem,
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