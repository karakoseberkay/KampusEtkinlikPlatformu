namespace KampusEtkinlik.Api.DTOs.Clubs; // bu dosyanın Clubs DTOları altında olduğunu belirtir


public sealed class ClubResponse // backendden frontend'e dönecek kulüp bilgilerini taşır
{
    public int Id { get; set; } // kulübün idsini frontend'e döndürür


    public string Name { get; set; } = string.Empty; // kulübün adını döndürür


    public string? Description { get; set; } // kulübün açıklamasını döndürür, boş olabilir


    public string? LogoUrl { get; set; } // kulübün logo url bilgisini döndürür, boş olabilir


    public string ManagerUserId { get; set; } = string.Empty; 
    // kulübü yöneten kullanıcının idsini döndürür


    public string ManagerFullName { get; set; } = string.Empty; 
    // kulüp yöneticisinin ad soyad bilgisini döndürür


    public int EventCount { get; set; } // kulübe ait toplam etkinlik sayısını döndürür
}