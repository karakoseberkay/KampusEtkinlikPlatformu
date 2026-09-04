namespace KampusEtkinlik.Api.Models; // bu dosyanın Models katmanına ait olduğunu belirtir

public class EventCheckInSession // etkinlik için oluşturulan qr kod oturumunu temsil eder
{
    public int Id { get; set; } // qr oturumunun benzersiz idsini tutar

    public int EventId { get; set; } // qr kodun hangi etkinliğe ait olduğunu tutar

    public Event Event { get; set; } = null!; // qr kodun bağlı olduğu etkinlik nesnesine ulaşmamızı sağlar

    public string TokenHash { get; set; } = string.Empty; // qr kod içerisinde kullanılan tokenın hashlenmiş halini tutar

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow; // qr kodun oluşturulduğu zamanı tutar

    public DateTimeOffset ExpiresAt { get; set; } // qr kodun geçerliliğinin biteceği zamanı tutar

    public bool IsActive { get; set; } = true; // qr kodun aktif olup olmadığını tutar
}