using System.ComponentModel.DataAnnotations;

namespace KampusEtkinlik.Api.Dtos.Users;

public sealed class UpdateUserRoleRequest
{
    [Required]
    public string Role { get; set; } = string.Empty;
}