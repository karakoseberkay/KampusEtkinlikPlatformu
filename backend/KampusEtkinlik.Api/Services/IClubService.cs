
using KampusEtkinlik.Api.DTOs.Clubs; // Club request response ve stats DTOlarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir


public interface IClubService // kulüple ilgili iş kurallarının hangi işlemleri yapacağını belirleyen servis sözleşmesidir
{
    Task<ClubStatsResponse?> GetStatsAsync(
        int id, // istatistikleri alınacak kulübün idsini alır
        string managerUserId, // isteği yapan kulüp yöneticisinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    ); // kulübün istatistiklerini getirir, kulüp bulunamazsa veya erişilemiyorsa null dönebilir


    Task<IReadOnlyList<ClubResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    ); // tüm kulüpleri frontend'e uygun ClubResponse listesi olarak getirir


    Task<ClubResponse?> GetByIdAsync(
        int id, // getirilecek kulübün idsini alır
        CancellationToken cancellationToken = default
    ); // verilen idye sahip kulübü getirir, bulunamazsa null döner


    Task<ClubResponse> CreateAsync(
        string managerUserId, // kulübü oluşturacak yöneticinin kullanıcı idsini alır
        CreateClubRequest request, // frontendden gelen kulüp oluşturma bilgilerini alır
        CancellationToken cancellationToken = default
    ); // gerekli kontrolleri yaptıktan sonra yeni kulüp oluşturur ve sonucunu döndürür


    Task<ClubResponse?> UpdateAsync(
        int id, // güncellenecek kulübün idsini alır
        string managerUserId, // işlemi yapan yöneticinin kullanıcı idsini alır
        UpdateClubRequest request, // frontendden gelen yeni kulüp bilgilerini alır
        CancellationToken cancellationToken = default
    ); // yetki ve diğer kontrollerden sonra kulübü günceller, bulunamazsa null dönebilir


    Task<bool> DeleteAsync(
        int id, // silinecek kulübün idsini alır
        string managerUserId, // silme işlemini yapan yöneticinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    ); // kullanıcı kulübün yöneticisiyse kulübü siler ve başarılı başarısız sonucunu döndürür
}

