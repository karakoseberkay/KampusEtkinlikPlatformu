 
using KampusEtkinlik.Api.Enums; // EventVisibility ve EventStatus enumlarına erişmemizi sağlar

namespace KampusEtkinlik.Api.DTOs.Events; // bu dosyanın Events DTOları altında olduğunu belirtir


public sealed class EventResponse // backendden frontend'e dönecek etkinlik bilgilerini taşır
{
    public int Id { get; set; } // etkinliğin idsini döndürür


    public int ClubId { get; set; } // etkinliğin bağlı olduğu kulübün idsini döndürür


    public string ClubName { get; set; } = string.Empty; // etkinliğin bağlı olduğu kulübün adını döndürür


    public string Title { get; set; } = string.Empty; // etkinliğin başlığını döndürür


    public string Description { get; set; } = string.Empty; // etkinliğin açıklamasını döndürür


    public DateTimeOffset StartDate { get; set; } // etkinliğin başlangıç tarihini ve saatini döndürür


    public string Location { get; set; } = string.Empty; // etkinliğin yapılacağı konumu döndürür


    public int Capacity { get; set; } // etkinliğin maksimum katılımcı kapasitesini döndürür


    public string Category { get; set; } = string.Empty; // etkinliğin kategori bilgisini döndürür


    public EventVisibility Visibility { get; set; } // etkinliğin Public veya ApprovalRequired kayıt tipini döndürür


    public EventStatus Status { get; set; } // etkinliğin Active veya Cancelled durumunu döndürür


    public DateTimeOffset CreatedAt { get; set; } // etkinliğin oluşturulduğu tarihi UTC olarak döndürür
}
 
