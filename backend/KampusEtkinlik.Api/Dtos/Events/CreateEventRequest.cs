using System.ComponentModel.DataAnnotations;
using KampusEtkinlik.Api.Enums;

namespace KampusEtkinlik.Api.DTOs.Events;

public sealed class CreateEventRequest
{
    [Range(1, int.MaxValue)]
    public int ClubId { get; set; }

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

    [Range(1, int.MaxValue)]
    public int Capacity { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    public EventVisibility Visibility { get; set; }
}