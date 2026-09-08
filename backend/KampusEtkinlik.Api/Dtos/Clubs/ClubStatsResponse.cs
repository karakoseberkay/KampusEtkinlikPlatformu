namespace KampusEtkinlik.Api.DTOs.Clubs; // bu dosyanın Clubs DTOları altında olduğunu belirtir

public sealed class ClubStatsResponse // kulübün genel istatistiklerini frontende taşır
{
    public int ClubId { get; set; } // istatistikleri gösterilen kulübün idsini döndürür

    public string ClubName { get; set; } = string.Empty; // kulübün adını döndürür

    public int TotalEventCount { get; set; } // kulübün toplam etkinlik sayısını döndürür

    public int ActiveEventCount { get; set; } // aktif durumdaki etkinliklerin sayısını döndürür

    public int CancelledEventCount { get; set; } // iptal edilmiş etkinliklerin sayısını döndürür

    public int TotalApprovedRegistrationCount { get; set; } // kulübün tüm etkinliklerindeki toplam onaylanmış kayıt sayısını döndürür

    public int TotalPendingRegistrationCount { get; set; } // kulübün tüm etkinliklerindeki toplam bekleyen kayıt sayısını döndürür

    public int TotalRejectedRegistrationCount { get; set; } // kulübün tüm etkinliklerindeki toplam reddedilen kayıt sayısını döndürür

    public double OverallRegistrationRate { get; set; } // toplam onaylı kayıtların toplam etkinlik kapasitesine göre yüzdesini döndürür

    public int TotalAttendanceEligibleRegistrationCount { get; set; }
    // başlamış ve iptal edilmemiş etkinliklerdeki toplam onaylı kayıt sayısını döndürür

    public int TotalCheckedInRegistrationCount { get; set; }
    // başlamış etkinliklerde qr ile gerçekten check-in yapan toplam kayıt sayısını döndürür

    public int TotalAbsentRegistrationCount { get; set; }
    // başlamış etkinliklerde onaylı kaydı olup check-in yapmayan toplam kayıt sayısını döndürür

    public double OverallAttendanceRate { get; set; }
    // check-in yapanların katılım için değerlendirilen onaylı kayıtlara göre yüzdesini döndürür

    public List<ClubEventStatsResponse> Events { get; set; } = new();
    // kulübün her etkinliğine ait detaylı istatistikleri liste olarak döndürür
}