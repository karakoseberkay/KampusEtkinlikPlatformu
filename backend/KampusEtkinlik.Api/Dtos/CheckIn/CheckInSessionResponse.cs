namespace KampusEtkinlik.Api.DTOs.CheckIn;


public sealed class CheckInSessionResponse
{
    public int EventId { get; set; }
    // qr kodun ait olduğu etkinliğin idsini tutar


    public string Token { get; set; } = string.Empty;
    // frontendin qr kod içerisine koyacağı geçici tokenı tutar


    public DateTimeOffset ExpiresAt { get; set; }
    // qr kodun geçerliliğinin biteceği zamanı tutar
}