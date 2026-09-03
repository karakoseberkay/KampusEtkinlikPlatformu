using System.ComponentModel.DataAnnotations;

namespace KampusEtkinlik.Api.DTOs.CheckIn;


public sealed class CheckInRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
    // öğrencinin qr koddan aldığı geçici tokenı tutar
}