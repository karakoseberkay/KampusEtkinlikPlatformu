using System.ComponentModel.DataAnnotations; // Required ve MaxLength gibi doğrulama attributelarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.DTOs.Clubs; // bu dosyanın Clubs DTOları altında olduğunu belirtir


public sealed class UpdateClubRequest // frontendden kulüp güncelleme endpointine gelecek bilgileri taşır
{
    [Required] // kulüp adının boş gönderilmesini engeller
    [MaxLength(150)] // kulüp adı en fazla 150 karakter olabilir
    public string Name { get; set; } = string.Empty; // kulübün güncellenecek adını alır


    [MaxLength(1000)] // açıklama varsa en fazla 1000 karakter olabilir
    public string? Description { get; set; } // kulübün güncellenecek açıklamasını alır, boş bırakılabilir


    [MaxLength(500)] // logo adresi varsa en fazla 500 karakter olabilir
    public string? LogoUrl { get; set; } // kulübün güncellenecek logo url bilgisini alır, boş bırakılabilir
}