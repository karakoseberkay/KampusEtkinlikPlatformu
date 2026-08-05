using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.DTOs.Registrations;

public sealed class RegistrationResponse
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string UserFullName { get; set; } = string.Empty;

    public int EventId { get; set; }

    public string EventTitle { get; set; } = string.Empty;

    public string ClubName { get; set; } = string.Empty;

    public DateTimeOffset RegisteredAt { get; set; }

    public RegistrationApprovalStatus ApprovalStatus { get; set; }
}