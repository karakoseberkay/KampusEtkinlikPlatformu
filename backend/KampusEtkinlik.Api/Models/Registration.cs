 
using KampusEtkinlik.Api.Enums; // RegistrationApprovalStatus enumuna erişmemizi sağlar

namespace KampusEtkinlik.Api.Models; // bu dosyanın Models katmanına ait olduğunu belirtir


public class Registration // kullanıcının bir etkinliğe yaptığı kayıt bilgisini temsil eden modeldir
{
    public int Id { get; set; } // kayıt işleminin benzersiz idsini tutar


    public string UserId { get; set; } = string.Empty; // etkinliğe kayıt olan kullanıcının idsini foreign key olarak tutar


    public ApplicationUser User { get; set; } = null!;
    // kayıt olan kullanıcı nesnesine ulaşmamızı sağlayan navigation propertydir


    public int EventId { get; set; } // kullanıcının kayıt olduğu etkinliğin idsini foreign key olarak tutar


    public Event Event { get; set; } = null!;
    // kayıt olunan etkinlik nesnesine ulaşmamızı sağlayan navigation propertydir


    public DateTimeOffset RegisteredAt { get; set; } = DateTimeOffset.UtcNow;
    // kullanıcının etkinliğe kayıt olduğu zamanı UTC olarak tutar


    public RegistrationApprovalStatus ApprovalStatus { get; set; }
    // kaydın Pending Approved veya Rejected durumunu tutar
}
 
