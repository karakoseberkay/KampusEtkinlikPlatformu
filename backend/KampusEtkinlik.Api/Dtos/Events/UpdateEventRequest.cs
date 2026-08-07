 
using System.ComponentModel.DataAnnotations; // Required MaxLength ve Range gibi doğrulama attributelarını kullanmamızı sağlar
using KampusEtkinlik.Api.Enums; // EventVisibility enumuna erişmemizi sağlar

namespace KampusEtkinlik.Api.DTOs.Events; // bu dosyanın Events DTOları altında olduğunu belirtir


public sealed class UpdateEventRequest // frontendden etkinlik güncelleme endpointine gelecek bilgileri taşır
{
    [Required] // etkinlik başlığının boş gönderilmesini engeller
    [MaxLength(200)] // etkinlik başlığı en fazla 200 karakter olabilir
    public string Title { get; set; } = string.Empty; // etkinliğin güncellenecek başlığını alır


    [Required] // etkinlik açıklamasının boş gönderilmesini engeller
    [MaxLength(3000)] // açıklama en fazla 3000 karakter olabilir
    public string Description { get; set; } = string.Empty; // etkinliğin güncellenecek açıklamasını alır


    public DateTimeOffset StartDate { get; set; } // etkinliğin güncellenecek başlangıç tarihini ve saatini alır


    [Required] // etkinlik konumunun boş gönderilmesini engeller
    [MaxLength(250)] // konum bilgisi en fazla 250 karakter olabilir
    public string Location { get; set; } = string.Empty; // etkinliğin güncellenecek konumunu alır


    [Range(1, int.MaxValue)] // kapasitenin en az 1 olmasını zorunlu tutar
    public int Capacity { get; set; } // etkinliğin güncellenecek maksimum katılımcı kapasitesini alır


    [Required] // kategori bilgisinin boş gönderilmesini engeller
    [MaxLength(100)] // kategori en fazla 100 karakter olabilir
    public string Category { get; set; } = string.Empty; // etkinliğin güncellenecek kategori bilgisini alır


    public EventVisibility Visibility { get; set; }
    // etkinliğin Public mı yoksa ApprovalRequired mı olacağını günceller
}
 
