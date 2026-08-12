using KampusEtkinlik.Api.Models; // Club modeline erişmemizi sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir


public interface IClubRepository 
// kulüp veritabanı işlemlerinin hangi metotlara sahip olması gerektiğini belirleyen sözleşmedir
{
    Task<Club?> GetByIdWithStatsAsync(
        int id, // getirilecek kulübün idsini alır
        CancellationToken cancellationToken = default 
        // işlem iptal edilirse veritabanı sorgusunu da iptal eder
    );
    // kulübü idye göre istatistiklerde kullanılacak ilişkili bilgileriyle getirir, tam olarak hangi verileri çektiğini ClubRepositoryde


    Task<List<Club>> GetAllAsync(
        CancellationToken cancellationToken = default
    ); // tüm kulüpleri veritabanından liste olarak getirir
    //klüp yoksa boş liste döndürür o yüzden null kontrolü yapmadım


    Task<Club?> GetByIdAsync(
        int id, // aranacak kulübün idsini alır
        CancellationToken cancellationToken = default
    ); // kulübü idsine göre getirir, bulunamazsa null döner


    Task<bool> NameExistsAsync(
        string name, // kontrol edilecek kulüp adını alır
        int? excludedClubId = null, // gerekirse belirli bir kulübü isim kontrolünün dışında bırakır
        CancellationToken cancellationToken = default
    ); // aynı isimde başka kulüp var mı kontrol eder ve true false döndürür


    Task AddAsync(
        Club club, // veritabanına eklenecek kulüp nesnesini alır
        CancellationToken cancellationToken = default
    ); // yeni kulübü DbContext üzerinden eklenmek üzere hazırlar


    void Remove(Club club); 
    // kulübü silinmek üzere işaretler, veritabanına gerçek silme ve ekleme SaveChanges ile yansır


    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    ); // ekleme güncelleme ve silme değişikliklerini veritabanına kaydeder
}