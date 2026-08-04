using System.ComponentModel.DataAnnotations;

namespace KampusEtkinlik.Api.Models;

public class Club
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [Required]
    public string ManagerUserId { get; set; } = string.Empty;

    public ApplicationUser ManagerUser { get; set; } = null!;

    public ICollection<Event> Events { get; set; } = new List<Event>();
}