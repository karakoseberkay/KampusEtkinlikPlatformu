namespace KampusEtkinlik.Api.DTOs.Clubs;

public sealed class ClubStatsResponse
{
    public int ClubId { get; set; }

    public string ClubName { get; set; } = string.Empty;

    public int TotalEventCount { get; set; }

    public int ActiveEventCount { get; set; }

    public int CancelledEventCount { get; set; }

    public int TotalApprovedRegistrationCount { get; set; }

    public int TotalPendingRegistrationCount { get; set; }

    public int TotalRejectedRegistrationCount { get; set; }

    public double OverallRegistrationRate { get; set; }

    public List<ClubEventStatsResponse> Events { get; set; } = new();
}