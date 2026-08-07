 
using KampusEtkinlik.Api.Enums; // RegistrationApprovalStatus enumuna erişmemizi sağlar

namespace KampusEtkinlik.Api.DTOs.Registrations; // bu dosyanın Registrations DTOları altında olduğunu belirtir


public sealed class RegistrationResponse // backendden frontend'e dönecek etkinlik kayıt bilgilerini taşır
{
    public int Id { get; set; } // kayıt işleminin idsini döndürür


    public string UserId { get; set; } = string.Empty; // etkinliğe kayıt olan kullanıcının idsini döndürür


    public string UserFullName { get; set; } = string.Empty; // etkinliğe kayıt olan kullanıcının ad soyad bilgisini döndürür


    public int EventId { get; set; } // kayıt olunan etkinliğin idsini döndürür


    public string EventTitle { get; set; } = string.Empty; // kayıt olunan etkinliğin başlığını döndürür


    public string ClubName { get; set; } = string.Empty; // etkinliğin bağlı olduğu kulübün adını döndürür


    public DateTimeOffset RegisteredAt { get; set; } // kullanıcının etkinliğe kayıt olduğu zamanı döndürür


    public RegistrationApprovalStatus ApprovalStatus { get; set; } // kaydın Pending Approved veya Rejected durumunu döndürür
}
 
