namespace KampusEtkinlik.Api.DTOs.CheckIn; // bu dosyanın CheckIn DTO katmanına ait olduğunu belirtir

public sealed class CheckInResponse // başarılı check-in işleminden sonra backenden frontende dönen bilgileri taşır
{
    public int RegistrationId { get; set; } // check-in yapılan kayıt işleminin idsini tutar

    public int EventId { get; set; } // katılım sağlanan etkinliğin idsini tutar

    public DateTimeOffset CheckedInAt { get; set; } // kullanıcının etkinliğe giriş yaptığı zamanı tutar

    public string Message { get; set; } = string.Empty; // başarılı işlem mesajını tutar
}