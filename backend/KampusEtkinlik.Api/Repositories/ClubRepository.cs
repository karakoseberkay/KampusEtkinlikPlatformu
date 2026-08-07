using KampusEtkinlik.Api.Data; // ApplicationDbContext üzerinden veritabanına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Club modeline erişmemizi sağlar
using Microsoft.EntityFrameworkCore; // Include AsNoTracking ToListAsync AnyAsync gibi EF Core metotlarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Repositories; // bu dosyanın Repositories katmanına ait olduğunu belirtir


public sealed class ClubRepository(
    ApplicationDbContext dbContext // veritabanı işlemlerini yapacağımız DbContext nesnesini DI üzerinden alır
) : IClubRepository // IClubRepositoryde tanımlanan kulüp veritabanı işlemlerini gerçekleştirir
{


    public async Task<List<Club>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Clubs // Clubs tablosu üzerinde sorgu başlatır
            .AsNoTracking() // sadece okuma yapılacağı için EF Coreun değişiklik takibi yapmasını engeller
            .Include(club => club.ManagerUser) // her kulüple beraber yönetici kullanıcı bilgisini de getirir
            .Include(club => club.Events) // her kulüple beraber etkinliklerini de getirir
            .OrderBy(club => club.Name) // kulüpleri isimlerine göre sıralar
            .ToListAsync(cancellationToken); // sorguyu veritabanında çalıştırıp sonucu liste olarak getirir
    }



    public async Task<Club?> GetByIdAsync(
        int id, // getirilecek kulübün idsini alır
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Clubs // Clubs tablosu üzerinde sorgu başlatır
            .Include(club => club.ManagerUser) // kulüple beraber yönetici bilgisini getirir
            .Include(club => club.Events) // kulüple beraber etkinliklerini getirir
            .FirstOrDefaultAsync(
                club => club.Id == id, // verilen idye sahip ilk kulübü bulur
                cancellationToken
            ); // kulüp bulunursa döndürür, bulunamazsa null döndürür
    }



    public async Task<Club?> GetByIdWithStatsAsync(
        int id, // istatistikleriyle getirilecek kulübün idsini alır
        CancellationToken cancellationToken = default
    )
    {
        return await dbContext.Clubs // Clubs tablosu üzerinde sorgu başlatır
            .AsNoTracking() // sadece okuma yapılacağı için değişiklik takibini kapatır
            .Include(club => club.Events) // kulübün etkinliklerini de sorguya dahil eder
            .ThenInclude(eventItem => eventItem.Registrations) // her etkinliğin kayıtlarını da sorguya dahil eder
            .FirstOrDefaultAsync(
                club => club.Id == id, // verilen idye sahip kulübü bulur
                cancellationToken
            ); // kulübü ilişkili etkinlik ve kayıtlarıyla getirir, bulunamazsa null döndürür
    }



    public async Task<bool> NameExistsAsync(
        string name, // kontrol edilecek kulüp adını alır
        int? excludedClubId = null, // gerekirse belirli bir kulübü kontrolden hariç tutar
        CancellationToken cancellationToken = default
    )
    {
        var normalizedName = name
            .Trim() // kulüp adının başındaki ve sonundaki boşlukları temizler
            .ToLower(); // büyük küçük harf farkını kaldırmak için küçük harfe çevirir


        return await dbContext.Clubs.AnyAsync( // koşula uyan en az bir kulüp var mı kontrol eder ve true false döndürür
            club =>
                club.Name.ToLower() == normalizedName // aynı isimde kulüp var mı kontrol eder
                && (
                    !excludedClubId.HasValue // hariç tutulacak kulüp idsi verilmemişse tüm kulüpleri kontrol eder
                    || club.Id != excludedClubId.Value // id verilmişse o kulübü kontrolün dışında bırakır
                ),
            cancellationToken
        );
    }



    public async Task AddAsync(
        Club club, // eklenecek kulüp nesnesini alır
        CancellationToken cancellationToken = default
    )
    {
        await dbContext.Clubs.AddAsync(
            club,
            cancellationToken
        ); // kulübü EF Core tarafından eklenmek üzere takip edilen nesnelere ekler, henüz veritabanına kaydetmez
    }



    public void Remove(Club club) // silinecek kulüp nesnesini alır
    {
        dbContext.Clubs.Remove(club); // kulübü EF Core tarafında silinmek üzere işaretler, henüz veritabanından silmez
    }



    public Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default
    )
    {
        return dbContext.SaveChangesAsync(cancellationToken); // bekleyen ekleme güncelleme ve silme işlemlerini PostgreSQL veritabanına kaydeder
    }
}