namespace KampusEtkinlik.Api.Constants; // bu dosyanın Constants klasörüne ait olduğunu belirtir


public static class RoleNames // projede kullanılan rol isimlerini tek bir yerde tutar
{
    public const string Student = "Student"; // öğrenci rolünün sabit adını tutar

    public const string ClubManager = "ClubManager"; // kulüp yöneticisi rolünün sabit adını tutar


    public static readonly string[] All = // projedeki bütün rol isimlerini tek listede toplar
    [
        Student, // Student rolünü listeye ekler
        ClubManager // ClubManager rolünü listeye ekler
    ];
}