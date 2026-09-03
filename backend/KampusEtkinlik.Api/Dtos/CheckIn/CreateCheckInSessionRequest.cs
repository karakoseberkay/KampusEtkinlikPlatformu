using System.ComponentModel.DataAnnotations;

namespace KampusEtkinlik.Api.DTOs.CheckIn;


public sealed class CreateCheckInSessionRequest
{
    [Range(1, 120)]
    public int ExpiresInMinutes { get; set; } = 10;
    // qr kodun kaç dakika geçerli olacağını belirler
}