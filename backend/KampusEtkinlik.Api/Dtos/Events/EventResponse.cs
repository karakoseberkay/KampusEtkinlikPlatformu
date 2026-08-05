using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.DTOs.Events;

public sealed class EventResponse
{
    public int Id { get; set; }

    public int ClubId { get; set; }

    public string ClubName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTimeOffset StartDate { get; set; }

    public string Location { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public string Category { get; set; } = string.Empty;

    public EventVisibility Visibility { get; set; }

    public EventStatus Status { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}