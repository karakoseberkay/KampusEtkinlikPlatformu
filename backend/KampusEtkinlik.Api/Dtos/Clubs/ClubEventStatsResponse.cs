using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.DTOs.Clubs;

public sealed class ClubEventStatsResponse
{
    public int EventId { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateTimeOffset StartDate { get; set; }

    public EventStatus Status { get; set; }

    public int Capacity { get; set; }

    public int ApprovedRegistrationCount { get; set; }

    public int PendingRegistrationCount { get; set; }

    public int RejectedRegistrationCount { get; set; }

    public double RegistrationRate { get; set; }
}