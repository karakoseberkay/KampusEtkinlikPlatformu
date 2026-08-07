
using KampusEtkinlik.Api.Enums; // EventStatus enumuna erişmemizi sağlar

namespace KampusEtkinlik.Api.DTOs.Clubs; // bu dosyanın Clubs DTOları altında olduğunu belirtir


public sealed class ClubEventStatsResponse // kulüp istatistiklerinde her etkinlik için frontend'e dönecek bilgileri taşır
{
    public int EventId { get; set; } // etkinliğin idsini döndürür


    public string Title { get; set; } = string.Empty; // etkinliğin başlığını döndürür


    public DateTimeOffset StartDate { get; set; } // etkinliğin başlangıç tarihini döndürür


    public EventStatus Status { get; set; } // etkinliğin Active veya Cancelled durumunu döndürür


    public int Capacity { get; set; } // etkinliğin toplam kapasitesini döndürür


    public int ApprovedRegistrationCount { get; set; } // etkinliğe onaylanmış kayıt sayısını döndürür


    public int PendingRegistrationCount { get; set; } // etkinlikte onay bekleyen kayıt sayısını döndürür


    public int RejectedRegistrationCount { get; set; } // etkinlikte reddedilmiş kayıt sayısını döndürür


    public double RegistrationRate { get; set; } // onaylanan kayıtların etkinlik kapasitesine göre yüzdesini döndürür
}

