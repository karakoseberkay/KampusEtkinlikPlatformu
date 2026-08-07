using System.ComponentModel.DataAnnotations; // Required ve MaxLength gibi doğrulama attributelarını kullanmamızı sağlar
using Microsoft.AspNetCore.Identity; // IdentityUser sınıfına erişmemizi sağlar

namespace KampusEtkinlik.Api.Models; // bu dosyanın Models katmanına ait olduğunu belirtir


public class ApplicationUser : IdentityUser // IdentityUserı genişleterek projeye özel kullanıcı modelimizi oluşturur
{
    [Required] // FullName alanının boş geçilmesini engeller
    [MaxLength(150)] // FullName veritabanında en fazla 150 karakter olabilir
    public string FullName { get; set; } = string.Empty; // kullanıcının ad soyad bilgisini tutar


    [MaxLength(150)] // Department alanı en fazla 150 karakter olabilir
    public string? Department { get; set; } // kullanıcının bölüm bilgisini tutar, boş olabilir


    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow; // kullanıcının oluşturulma tarihini UTC olarak tutar


    public ICollection<Club> ManagedClubs { get; set; } = new List<Club>();
    // kullanıcının yönettiği kulüpleri tutan navigation propertydir, bir kullanıcı birden fazla kulüp yönetebilir


    public ICollection<Registration> Registrations { get; set; }
        = new List<Registration>();
    // kullanıcının etkinlik kayıtlarını tutan navigation propertydir, bir kullanıcının birden fazla kaydı olabilir
}