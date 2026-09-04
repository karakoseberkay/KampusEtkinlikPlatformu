namespace KampusEtkinlik.Api.DTOs.CheckIn; // bu dosyanın CheckIn DTO katmanına ait olduğunu belirtir

public sealed class CheckInSessionResponse // qr oturumu oluşturulduktan sonra backenden frontende dönen bilgileri taşır
{
    public int EventId { get; set; } // qr kodun ait olduğu etkinliğin idsini tutar

    public string Token { get; set; } = string.Empty; // frontendin qr kod içerisine koyacağı geçici tokenı tutar

    public DateTimeOffset ExpiresAt { get; set; } // qr kodun geçerliliğinin biteceği zamanı tutar
}