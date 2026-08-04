using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace KampusEtkinlik.Api.Models;

public class ApplicationUser : IdentityUser
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Department { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Club> ManagedClubs { get; set; } = new List<Club>();

    public ICollection<Registration> Registrations { get; set; }
        = new List<Registration>();
}