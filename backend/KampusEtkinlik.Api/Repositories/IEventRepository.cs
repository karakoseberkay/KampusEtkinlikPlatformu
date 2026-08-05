using KampusEtkinlik.Api.Models;

namespace KampusEtkinlik.Api.Repositories;

public interface IEventRepository
{
    Task<List<Event>> GetAllAsync(
        CancellationToken cancellationToken = default
    );

    Task<List<Event>> GetPopularAsync(
        int limit,
        CancellationToken cancellationToken = default
    );

    Task<Event?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default
    );

    Task AddAsync(
        Event eventItem,
        CancellationToken cancellationToken = default
    );

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    );
}