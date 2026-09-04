using System.ComponentModel.DataAnnotations; // Required validation özelliğini kullanmamızı sağlar

namespace KampusEtkinlik.Api.DTOs.CheckIn; // bu dosyanın CheckIn DTO katmanına ait olduğunu belirtir

public sealed class CheckInRequest // qr okutulduğunda frontendden backende gönderilen token bilgisini taşır
{
    [Required] // token bilgisinin boş gönderilmesini engeller
    public string Token { get; set; } = string.Empty; // kullanıcının qr koddan aldığı geçici tokenı tutar
}