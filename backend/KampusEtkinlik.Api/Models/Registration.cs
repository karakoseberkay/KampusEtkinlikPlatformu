using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.Models;

public class Registration
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    public int EventId { get; set; }

    public Event Event { get; set; } = null!;

    public DateTimeOffset RegisteredAt { get; set; } = DateTimeOffset.UtcNow;

    public RegistrationApprovalStatus ApprovalStatus { get; set; }
}