using System.ComponentModel.DataAnnotations;
using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.Models;

public class Event
{
    public int Id { get; set; }

    public int ClubId { get; set; }

    public Club Club { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(3000)]
    public string Description { get; set; } = string.Empty;

    public DateTimeOffset StartDate { get; set; }

    [Required]
    [MaxLength(250)]
    public string Location { get; set; } = string.Empty;

    public int Capacity { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    public EventVisibility Visibility { get; set; }

    public EventStatus Status { get; set; } = EventStatus.Active;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Registration> Registrations { get; set; }
        = new List<Registration>();
}