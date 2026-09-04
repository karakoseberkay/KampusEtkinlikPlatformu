using System.ComponentModel.DataAnnotations; // Range validation özelliğini kullanmamızı sağlar

namespace KampusEtkinlik.Api.DTOs.CheckIn; // bu dosyanın CheckIn DTO katmanına ait olduğunu belirtir

public sealed class CreateCheckInSessionRequest // qr kod oluşturulurken frontendden gelen süre bilgisini taşır
{
    [Range(1, 120)] // qr süresinin 1 ile 120 dakika arasında olmasını zorunlu yapar
    public int ExpiresInMinutes { get; set; } = 10; // qr kodun kaç dakika geçerli olacağını belirler
}