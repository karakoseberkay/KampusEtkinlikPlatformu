 
using System.ComponentModel.DataAnnotations; // Required MaxLength ve Range gibi doğrulama attributelarını kullanmamızı sağlar
using KampusEtkinlik.Api.Enums; // EventVisibility enumuna erişmemizi sağlar

namespace KampusEtkinlik.Api.DTOs.Events; // bu dosyanın Events DTOları altında olduğunu belirtir


public sealed class CreateEventRequest // frontendden etkinlik oluşturma endpointine gelecek bilgileri taşır
{
    [Range(1, int.MaxValue)] // ClubId değerinin 1 veya daha büyük olmasını zorunlu tutar
    public int ClubId { get; set; } // etkinliğin hangi kulübe ait olacağını belirtir


    [Required] // etkinlik başlığının boş gönderilmesini engeller
    [MaxLength(200)] // etkinlik başlığı en fazla 200 karakter olabilir
    public string Title { get; set; } = string.Empty; // oluşturulacak etkinliğin başlığını alır


    [Required] // etkinlik açıklamasının boş gönderilmesini engeller
    [MaxLength(3000)] // açıklama en fazla 3000 karakter olabilir
    public string Description { get; set; } = string.Empty; // oluşturulacak etkinliğin açıklamasını alır


    public DateTimeOffset StartDate { get; set; } // etkinliğin başlayacağı tarih ve saat bilgisini alır


    [Required] // etkinlik konumunun boş gönderilmesini engeller
    [MaxLength(250)] // konum bilgisi en fazla 250 karakter olabilir
    public string Location { get; set; } = string.Empty; // etkinliğin yapılacağı konumu alır


    [Range(1, int.MaxValue)] // kapasitenin en az 1 olmasını zorunlu tutar
    public int Capacity { get; set; } // etkinliğin maksimum katılımcı kapasitesini alır


    [Required] // kategori bilgisinin boş gönderilmesini engeller
    [MaxLength(100)] // kategori en fazla 100 karakter olabilir
    public string Category { get; set; } = string.Empty; // etkinliğin kategori bilgisini alır


    public EventVisibility Visibility { get; set; }
    // etkinliğin Public mı yoksa ApprovalRequired mı olacağını belirler
}
 
