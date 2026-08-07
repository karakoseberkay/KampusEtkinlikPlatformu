using System.ComponentModel.DataAnnotations; // Required ve MaxLength gibi doğrulama attributelarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Models; // bu dosyanın Models katmanına ait olduğunu belirtir


public class Club // veritabanındaki kulüp bilgisini temsil eden modeldir
{
    public int Id { get; set; } // kulübün benzersiz idsini tutar


    [Required] // kulüp adının boş olmasını engeller
    [MaxLength(150)] // kulüp adı en fazla 150 karakter olabilir
    public string Name { get; set; } = string.Empty; // kulübün adını tutar


    [MaxLength(1000)] // açıklama varsa en fazla 1000 karakter olabilir
    public string? Description { get; set; } // kulübün açıklamasını tutar, boş bırakılabilir


    [MaxLength(500)] // logo adresi en fazla 500 karakter olabilir
    public string? LogoUrl { get; set; } // kulübün logo görselinin url adresini tutar, boş bırakılabilir


    [Required] // her kulübün bir yönetici kullanıcısı olmak zorundadır
    public string ManagerUserId { get; set; } = string.Empty; // kulübü yöneten kullanıcının idsini foreign key olarak tutar


    public ApplicationUser ManagerUser { get; set; } = null!;
    // kulübün bağlı olduğu yönetici kullanıcıya ulaşmamızı sağlayan navigation propertydir


    public ICollection<Event> Events { get; set; } = new List<Event>();
    // kulübe ait etkinlikleri tutan navigation propertydir, bir kulübün birden fazla etkinliği olabilir
}