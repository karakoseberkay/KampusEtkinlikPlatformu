using System.ComponentModel.DataAnnotations; // Required gibi validation attributelarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Dtos.Users; // Kullanıcılarla ilgili DTOların bulunduğu namespace

public sealed class UpdateUserRoleRequest // Kullanıcının rolünü değiştirmek için frontendden gelen request modelidir
{
    [Required] // Role alanının request içinde zorunlu olmasını sağlar
    public string Role { get; set; } = string.Empty; // Kullanıcıya atanacak yeni rol bilgisini tutar
}