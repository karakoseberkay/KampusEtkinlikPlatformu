using KampusEtkinlik.Api.Data; // ApplicationDbContext üzerinden veritabanına erişmemizi sağlar
using KampusEtkinlik.Api.Enums; // RegistrationApprovalStatus enumuna erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Registration modeline erişmemizi sağlar
using Microsoft.EntityFrameworkCore; // Include Where CountAsync AsNoTracking gibi EF Core metotlarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir


public sealed class RegistrationRepository(ApplicationDbContext dbContext) : IRegistrationRepository{
     // kayıt veritabanı işlemlerini yapacağımız DbContexti DI üzerinden alır
 // IRegistrationRepositoryde tanımlanan kayıt veritabanı işlemlerini gerçekleştirir



    public async Task<Registration?> GetByIdAsync(
        int id, // getirilecek kayıt işleminin idsini alır
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Registrations // Registrations tablosu üzerinde sorgu başlatır
            .Include(registration => registration.User) // kayıtla beraber kullanıcı bilgisini de getirir

            .Include(registration => registration.Event) // kayıtla beraber etkinlik bilgisini de getirir
            .ThenInclude(eventItem => eventItem.Club) // etkinliğin bağlı olduğu kulüp bilgisini de getirir

            .FirstOrDefaultAsync(registration => registration.Id == id,cancellationToken);
                 // verilen idye sahip kaydı arar
                
             // kayıt bulunursa döndürür, bulunamazsa null döndürür
    }



    public async Task<Registration?> GetByUserAndEventAsync(
        string userId, // kontrol edilecek kullanıcının idsini alır
        int eventId, // kontrol edilecek etkinliğin idsini alır
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Registrations // Registrations tablosu üzerinde sorgu başlatır
            .AsNoTracking() // sadece kontrol amaçlı okunduğu için EF Coreun değişiklik takibi yapmasını engeller

            .FirstOrDefaultAsync(registration =>registration.UserId == userId && registration.EventId == eventId,
                
                     // kayıt belirtilen kullanıcıya mı ait
                     // ve belirtilen etkinliğe mi ait kontrol eder
                cancellationToken
            ); // eşleşen kayıt varsa döndürür, yoksa null döndürür
    }



    public async Task<Registration?> GetByUserAndEventForUpdateAsync(
        string userId,
        int eventId,
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Registrations
            .Include(registration => registration.Event)
            .FirstOrDefaultAsync(
                registration =>
                    registration.UserId == userId &&
                    registration.EventId == eventId,
                cancellationToken
            );
        // qr check-in sırasında CheckedInAt alanı değiştirileceği için kayıt takipli olarak getirilir
    }



    public async Task<List<Registration>> GetByUserIdAsync(
        string userId, // kayıtları getirilecek kullanıcının idsini alır
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Registrations // Registrations tablosu üzerinde sorgu başlatır
            .AsNoTracking() // kayıtlar sadece okunacağı için değişiklik takibini kapatır

            .Include(registration => registration.User) // kayıtla beraber kullanıcı bilgisini getirir

            .Include(registration => registration.Event) // kayıt olunan etkinliği getirir
                .ThenInclude(eventItem => eventItem.Club) // etkinliğin bağlı olduğu kulüp bilgisini de getirir

            .Where(registration => registration.UserId == userId
                
            ) // sadece belirtilen kullanıcıya ait kayıtları filtreler

            .OrderByDescending(registration =>registration.RegisteredAt
                
            ) // kayıtları en yeni kayıt tarihinden eskiye doğru sıralar

            .ToListAsync(cancellationToken); // sorguyu çalıştırıp kayıtları liste olarak getirir
    }



    public async Task<List<Registration>> GetByEventIdAsync(
        int eventId, // kayıtları getirilecek etkinliğin idsini alır
        RegistrationApprovalStatus? approvalStatus = null, // istersek Pending Approved veya Rejected durumuna göre filtre uygular
        CancellationToken cancellationToken = default
    )
    {
        var query = dbContext.Registrations // Registrations tablosu üzerinde sorgu hazırlamaya başlar
            .AsNoTracking() // sadece okuma yapılacağı için değişiklik takibini kapatır

            .Include(registration => registration.User) // kayıt olan kullanıcının bilgisini de getirir

            .Include(registration => registration.Event) // kayıt olunan etkinlik bilgisini getirir
                .ThenInclude(eventItem => eventItem.Club) // etkinliğin kulüp bilgisini de getirir

            .Where(registration => registration.EventId == eventId
                
            ); // sadece belirtilen etkinliğe ait kayıtları sorguya dahil eder


        if (approvalStatus.HasValue) // approvalStatus filtresi verilmiş mi kontrol eder
        {
            query = query.Where(registration =>registration.ApprovalStatus == approvalStatus.Value);
                
                
            
            // filtre verilmişse sadece istenen Pending Approved veya Rejected kayıtları sorguya ekler
        }


        return await query.OrderBy(registration => registration.ApprovalStatus)
             // kayıtları önce onay durumuna göre sıralar

            .ThenBy(registration => registration.RegisteredAt)
                
             // aynı durumdaki kayıtları kayıt tarihine göre sıralar

            .ToListAsync(cancellationToken); // hazırlanan sorguyu çalıştırıp sonucu liste olarak getirir
    }



    public Task<int> CountApprovedByEventAsync(
        int eventId, // onaylanmış kayıtları sayılacak etkinliğin idsini alır
        CancellationToken cancellationToken = default
    )
    {
        return dbContext.Registrations.CountAsync(
            registration => registration.EventId == eventId
                 // sadece belirtilen etkinliğin kayıtlarını alır
                && registration.ApprovalStatus == RegistrationApprovalStatus.Approved,
                     // sadece Approved kayıtları sayar
            cancellationToken);
        
        // etkinliğin toplam onaylanmış kayıt sayısını veritabanında hesaplayıp döndürür
    }



    public async Task AddAsync(
        Registration registration, // veritabanına eklenecek kayıt nesnesini alır
        CancellationToken cancellationToken = default
    )
    {
        await dbContext.Registrations.AddAsync(registration, cancellationToken);
            
         // kaydı EF Core tarafında eklenmek üzere hazırlar, henüz veritabanına yazmaz
    }



    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default){
    
        return dbContext.SaveChangesAsync(cancellationToken);
        // kayıt ekleme veya ApprovalStatus değişikliklerini PostgreSQL veritabanına kaydeder
    }
}