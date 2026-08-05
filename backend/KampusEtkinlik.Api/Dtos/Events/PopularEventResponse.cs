using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.DTOs.Events;

public sealed class PopularEventResponse
{
    public int Id { get; set; }

    public int ClubId { get; set; }

    public string ClubName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public DateTimeOffset StartDate { get; set; }

    public string Location { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public EventVisibility Visibility { get; set; }

    public int Capacity { get; set; }

    public int ApprovedRegistrationCount { get; set; }

    public int RemainingCapacity { get; set; }

    public double RegistrationRate { get; set; }
}