using System.ComponentModel.DataAnnotations;

namespace KampusEtkinlik.Api.DTOs.Clubs;

public sealed class CreateClubRequest
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }
}