 
using KampusEtkinlik.Api.Enums; // RegistrationApprovalStatus enumuna erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Registration modeline erişmemizi sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir


public interface IRegistrationRepository // etkinlik kayıtlarıyla ilgili veritabanı işlemlerinin sözleşmesini tanımlar
{
    Task<Registration?> GetByIdAsync(
        int id, // getirilecek kayıt işleminin idsini alır
        CancellationToken cancellationToken = default
    ); // kayıt işlemini idsine göre getirir, bulunamazsa null döner


    Task<Registration?> GetByUserAndEventAsync(
        string userId, // kontrol edilecek kullanıcının idsini alır
        int eventId, // kontrol edilecek etkinliğin idsini alır
        CancellationToken cancellationToken = default
    ); // kullanıcının belirtilen etkinliğe daha önce kayıt olup olmadığını getirir, yoksa null döner


    Task<List<Registration>> GetByUserIdAsync(
        string userId, // kayıtları getirilecek kullanıcının idsini alır
        CancellationToken cancellationToken = default
    ); // kullanıcının yaptığı bütün etkinlik kayıtlarını liste olarak getirir


    Task<List<Registration>> GetByEventIdAsync(
        int eventId, // kayıtları getirilecek etkinliğin idsini alır
        RegistrationApprovalStatus? approvalStatus = null, // istersek sadece Pending Approved veya Rejected kayıtları filtrelememizi sağlar
        CancellationToken cancellationToken = default
    ); // etkinliğe yapılan kayıtları getirir, approvalStatus verilirse duruma göre filtreler


    Task<int> CountApprovedByEventAsync(
        int eventId, // onaylanmış kayıtları sayılacak etkinliğin idsini alır
        CancellationToken cancellationToken = default
    ); // etkinliğin Approved durumundaki kayıt sayısını getirir


    Task AddAsync(
        Registration registration, // veritabanına eklenecek etkinlik kayıt nesnesini alır
        CancellationToken cancellationToken = default
    ); // yeni kaydı DbContext üzerinden eklenmek üzere hazırlar


    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    ); // kayıt üzerindeki ekleme veya durum değişikliklerini veritabanına kaydeder
}
 
