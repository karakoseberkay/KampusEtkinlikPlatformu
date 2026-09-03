namespace KampusEtkinlik.Api.DTOs.CheckIn;


public sealed class CheckInResponse
{
    public int RegistrationId { get; set; }
    // check-in yapılan kayıt işleminin idsini tutar


    public int EventId { get; set; }
    // katılım sağlanan etkinliğin idsini tutar


    public DateTimeOffset CheckedInAt { get; set; }
    // öğrencinin etkinliğe giriş yaptığı zamanı tutar


    public string Message { get; set; } = string.Empty;
    // başarılı işlem mesajını tutar
}