 
using KampusEtkinlik.Api.Enums; // EventVisibility enumuna erişmemizi sağlar

namespace KampusEtkinlik.Api.DTOs.Events; // bu dosyanın Events DTOları altında olduğunu belirtir


public sealed class PopularEventResponse // popüler etkinlikleri frontend'e istatistik bilgileriyle döndürmek için kullanılır
{
    public int Id { get; set; } // etkinliğin idsini döndürür


    public int ClubId { get; set; } // etkinliğin bağlı olduğu kulübün idsini döndürür


    public string ClubName { get; set; } = string.Empty; // etkinliği oluşturan kulübün adını döndürür


    public string Title { get; set; } = string.Empty; // etkinliğin başlığını döndürür


    public DateTimeOffset StartDate { get; set; } // etkinliğin başlangıç tarihini ve saatini döndürür


    public string Location { get; set; } = string.Empty; // etkinliğin yapılacağı konumu döndürür


    public string Category { get; set; } = string.Empty; // etkinliğin kategori bilgisini döndürür


    public EventVisibility Visibility { get; set; } // etkinliğin Public veya ApprovalRequired kayıt tipini döndürür


    public int Capacity { get; set; } // etkinliğin toplam kapasitesini döndürür


    public int ApprovedRegistrationCount { get; set; } // etkinliğe onaylanmış toplam kayıt sayısını döndürür


    public int RemainingCapacity { get; set; } // etkinlikte kalan boş kontenjan sayısını döndürür


    public double RegistrationRate { get; set; } // onaylı kayıtların toplam kapasiteye göre yüzdesini döndürür
}
 
