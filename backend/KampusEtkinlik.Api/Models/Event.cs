using System.ComponentModel.DataAnnotations; // Required ve MaxLength gibi doğrulama attributelarını kullanmamızı sağlar
using KampusEtkinlik.Api.Enums; // EventVisibility ve EventStatus enumlarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Models; // bu dosyanın Models katmanına ait olduğunu belirtir


public class Event // veritabanındaki etkinlik bilgisini temsil eden modeldir
{
    public int Id { get; set; } // etkinliğin benzersiz idsini tutar (primary key)


    public int ClubId { get; set; } 
    // etkinliğin bağlı olduğu kulübün idsini foreign key olarak tutar (foreign key)


    public Club Club { get; set; } = null!;
    // etkinliğin bağlı olduğu Club nesnesine ulaşmamızı sağlayan navigation propertydir (1-N)


    [Required] // etkinlik başlığının boş olmasını engeller
    [MaxLength(200)] // etkinlik başlığı en fazla 200 karakter olabilir
    public string Title { get; set; } = string.Empty; // etkinliğin başlığını tutar


    [Required] // etkinlik açıklamasının boş olmasını engeller
    [MaxLength(3000)] // etkinlik açıklaması en fazla 3000 karakter olabilir
    public string Description { get; set; } = string.Empty; // etkinliğin açıklamasını tutar


    public DateTimeOffset StartDate { get; set; } // etkinliğin başlayacağı tarih ve saat bilgisini tutar


    [Required] // etkinlik konumunun boş olmasını engeller
    [MaxLength(250)] // konum bilgisi en fazla 250 karakter olabilir
    public string Location { get; set; } = string.Empty; // etkinliğin yapılacağı konumu tutar


    public int Capacity { get; set; } // etkinliğin maksimum katılımcı kapasitesini tutar


    [Required] // etkinlik kategorisinin boş olmasını engeller
    [MaxLength(100)] // kategori en fazla 100 karakter olabilir
    public string Category { get; set; } = string.Empty; // etkinliğin kategori bilgisini tutar


    public EventVisibility Visibility { get; set; }
    // etkinliğin Public mı yoksa ApprovalRequired mı olduğunu tutar


    public EventStatus Status { get; set; } = EventStatus.Active;
    // etkinliğin Active veya Cancelled durumunu tutar, yeni etkinlik varsayılan olarak Active oluşturulur


    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    // etkinliğin oluşturulduğu zamanı UTC olarak tutar


    public ICollection<Registration> Registrations { get; set; }= new List<Registration>();
    // etkinliğe yapılan kayıtları tutan navigation propertydir, bir etkinliğin birden fazla kaydı olabilir (1-N)
}