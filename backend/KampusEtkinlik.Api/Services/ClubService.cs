
using KampusEtkinlik.Api.DTOs.Clubs; // kulüp request response ve istatistik DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Club modeline erişmemizi sağlar
using KampusEtkinlik.Api.Repositories; // IClubRepository üzerinden kulüp veritabanı işlemlerine erişmemizi sağlar
using KampusEtkinlik.Api.Enums; // EventStatus ve RegistrationApprovalStatus enumlarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir


public sealed class ClubService(
    IClubRepository clubRepository // kulüp veritabanı işlemlerini yapacak repositoryi DI üzerinden alır
) : IClubService // IClubServicede tanımlanan kulüp iş kurallarını gerçekleştirir
{


    public async Task<IReadOnlyList<ClubResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var clubs = await clubRepository.GetAllAsync(
            cancellationToken
        ); // repository üzerinden tüm kulüpleri veritabanından getirir


        return clubs
            .Select(MapToResponse) // her Club modelini frontend için ClubResponse DTOsuna çevirir
            .ToList(); // sonuçları liste haline getirir
    }



    public async Task<ClubResponse?> GetByIdAsync(
        int id, // getirilecek kulübün idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var club = await clubRepository.GetByIdAsync(
            id,
            cancellationToken
        ); // verilen idye sahip kulübü repository üzerinden getirir


        return club is null
            ? null // kulüp bulunamadıysa null döndürür
            : MapToResponse(club); // kulüp bulunduysa ClubResponsea çevirip döndürür
    }



    public async Task<ClubStatsResponse?> GetStatsAsync(
        int id, // istatistikleri getirilecek kulübün idsini alır
        string managerUserId, // işlemi yapan kulüp yöneticisinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var club = await clubRepository.GetByIdWithStatsAsync(
            id,
            cancellationToken
        ); // kulübü etkinlikleri ve etkinlik kayıtlarıyla beraber getirir


        if (club is null) // kulüp bulunamazsa
        {
            return null;
        }


        if (club.ManagerUserId != managerUserId) // işlemi yapan kullanıcı bu kulübün yöneticisi mi kontrol eder
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi yönettiğiniz kulübün istatistiklerini görüntüleyebilirsiniz."
            ); // başka yöneticinin kulüp istatistiklerine erişmesini engeller
        }


        var eventStats = club.Events
            .OrderByDescending(eventItem => eventItem.StartDate) // etkinlikleri en yeni tarihten eskiye doğru sıralar
            .Select(eventItem => // her etkinlik için ayrı istatistik oluşturur
            {
                var approvedCount =
                    eventItem.Registrations.Count(registration =>
                        registration.ApprovalStatus
                        == RegistrationApprovalStatus.Approved
                    );
                // etkinlikte Approved durumundaki kayıtların sayısını hesaplar


                var pendingCount =
                    eventItem.Registrations.Count(registration =>
                        registration.ApprovalStatus
                        == RegistrationApprovalStatus.Pending
                    );
                // etkinlikte Pending durumundaki kayıtların sayısını hesaplar


                var rejectedCount =
                    eventItem.Registrations.Count(registration =>
                        registration.ApprovalStatus
                        == RegistrationApprovalStatus.Rejected
                    );
                // etkinlikte Rejected durumundaki kayıtların sayısını hesaplar


                var registrationRate =
                    eventItem.Capacity > 0 // kapasite 0dan büyükse oran hesaplar
                        ? Math.Round(
                            approvedCount * 100.0 / eventItem.Capacity,
                            2
                        ) // onaylanan kayıtların kapasiteye göre yüzdesini hesaplar ve 2 basamağa yuvarlar
                        : 0; // kapasite 0 ise sıfıra bölme hatası olmaması için oranı 0 yapar


                return new ClubEventStatsResponse // hesaplanan etkinlik istatistiklerini response nesnesine dönüştürür
                {
                    EventId = eventItem.Id, // etkinlik idsi
                    Title = eventItem.Title, // etkinlik başlığı
                    StartDate = eventItem.StartDate, // etkinlik başlangıç tarihi
                    Status = eventItem.Status, // etkinliğin Active veya Cancelled durumu
                    Capacity = eventItem.Capacity, // etkinliğin toplam kapasitesi
                    ApprovedRegistrationCount = approvedCount, // onaylanan kayıt sayısı
                    PendingRegistrationCount = pendingCount, // bekleyen kayıt sayısı
                    RejectedRegistrationCount = rejectedCount, // reddedilen kayıt sayısı
                    RegistrationRate = registrationRate // etkinliğin doluluk/onaylı kayıt oranı
                };
            })
            .ToList(); // bütün etkinlik istatistiklerini liste haline getirir


        var totalCapacity = club.Events.Sum(
            eventItem => eventItem.Capacity
        ); // kulübün tüm etkinliklerinin toplam kapasitesini hesaplar


        var totalApprovedCount = eventStats.Sum(
            eventItem => eventItem.ApprovedRegistrationCount
        ); // bütün etkinliklerdeki toplam onaylanmış kayıt sayısını hesaplar


        var overallRegistrationRate =
            totalCapacity > 0
                ? Math.Round(
                    totalApprovedCount * 100.0 / totalCapacity,
                    2
                ) // toplam onaylı kayıtların toplam kapasiteye göre yüzdesini hesaplar
                : 0; // toplam kapasite 0 ise sıfıra bölmeyi engeller


        return new ClubStatsResponse // kulübün genel istatistiklerini frontend için hazırlar
        {
            ClubId = club.Id, // kulüp idsi
            ClubName = club.Name, // kulüp adı

            TotalEventCount = club.Events.Count, // kulübün toplam etkinlik sayısı

            ActiveEventCount = club.Events.Count(eventItem =>
                eventItem.Status == EventStatus.Active
            ), // aktif etkinliklerin sayısını hesaplar

            CancelledEventCount = club.Events.Count(eventItem =>
                eventItem.Status == EventStatus.Cancelled
            ), // iptal edilmiş etkinliklerin sayısını hesaplar

            TotalApprovedRegistrationCount = totalApprovedCount, // toplam onaylanan kayıt sayısı

            TotalPendingRegistrationCount = eventStats.Sum(
                eventItem => eventItem.PendingRegistrationCount
            ), // bütün etkinliklerdeki toplam bekleyen kayıt sayısı

            TotalRejectedRegistrationCount = eventStats.Sum(
                eventItem => eventItem.RejectedRegistrationCount
            ), // bütün etkinliklerdeki toplam reddedilen kayıt sayısı

            OverallRegistrationRate = overallRegistrationRate, // kulübün genel kayıt oranı

            Events = eventStats // etkinlik bazındaki detaylı istatistikleri ekler
        };
    }



    public async Task<ClubResponse> CreateAsync(
        string managerUserId, // yeni kulübün yöneticisi olacak kullanıcının idsini alır
        CreateClubRequest request, // frontendden gelen kulüp oluşturma bilgilerini alır
        CancellationToken cancellationToken = default
    )
    {
        var clubName = request.Name.Trim(); // kulüp adının başındaki ve sonundaki boşlukları temizler


        if (string.IsNullOrWhiteSpace(clubName)) // temizlendikten sonra kulüp adı boş mu kontrol eder
        {
            throw new ArgumentException(
                "Kulüp adı boş bırakılamaz."
            ); // boş isimle kulüp oluşturulmasını engeller
        }


        var nameExists =
            await clubRepository.NameExistsAsync(
                clubName,
                cancellationToken: cancellationToken
            ); // aynı isimde başka kulüp var mı repository üzerinden kontrol eder


        if (nameExists) // aynı isimde kulüp varsa
        {
            throw new InvalidOperationException(
                "Bu isimde bir kulüp zaten bulunuyor."
            ); // aynı isimle ikinci kulüp oluşturulmasını engeller
        }


        var club = new Club // frontendden gelen bilgilerle yeni Club modeli oluşturur
        {
            Name = clubName, // temizlenmiş kulüp adını verir

            Description = NormalizeOptionalText(
                request.Description
            ), // açıklama boşsa null yapar doluysa boşluklarını temizler

            LogoUrl = NormalizeOptionalText(
                request.LogoUrl
            ), // logo adresi boşsa null yapar doluysa boşluklarını temizler

            ManagerUserId = managerUserId // giriş yapan yöneticiyi kulübün sahibi/yöneticisi yapar
        };


        await clubRepository.AddAsync(
            club,
            cancellationToken
        ); // kulübü eklenmek üzere DbContexte gönderir


        await clubRepository.SaveChangesAsync(
            cancellationToken
        ); // yeni kulübü gerçekten PostgreSQL veritabanına kaydeder


        var createdClub =
            await clubRepository.GetByIdAsync(
                club.Id,
                cancellationToken
            ); // kaydedilen kulübü yönetici ve etkinlik bilgileriyle tekrar veritabanından getirir


        if (createdClub is null) // oluşturulan kulüp tekrar okunamazsa
        {
            throw new InvalidOperationException(
                "Kulüp oluşturuldu ancak tekrar okunamadı."
            ); // beklenmeyen veri erişim hatasında işlemi hata ile durdurur
        }


        return MapToResponse(createdClub); // oluşturulan Club modelini ClubResponsea çevirip frontend'e döndürür
    }



    public async Task<ClubResponse?> UpdateAsync(
        int id, // güncellenecek kulübün idsini alır
        string managerUserId, // işlemi yapan yöneticinin kullanıcı idsini alır
        UpdateClubRequest request, // frontendden gelen yeni kulüp bilgilerini alır
        CancellationToken cancellationToken = default
    )
    {
        var club = await clubRepository.GetByIdAsync(
            id,
            cancellationToken
        ); // güncellenecek kulübü veritabanından getirir


        if (club is null) // kulüp bulunamazsa
        {
            return null;
        }


        if (club.ManagerUserId != managerUserId) // işlemi yapan kullanıcı kulübün yöneticisi mi kontrol eder
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi yönettiğiniz kulübü güncelleyebilirsiniz."
            ); // başka yöneticinin kulübünü güncellemeyi engeller
        }


        var clubName = request.Name.Trim(); // yeni kulüp adının başındaki ve sonundaki boşlukları temizler


        if (string.IsNullOrWhiteSpace(clubName)) // isim temizlendikten sonra boş mu kontrol eder
        {
            throw new ArgumentException(
                "Kulüp adı boş bırakılamaz."
            ); // boş isimle güncellemeyi engeller
        }


        var nameExists =
            await clubRepository.NameExistsAsync(
                clubName,
                club.Id, // mevcut kulübü isim tekrar kontrolünün dışında bırakır
                cancellationToken
            ); // başka bir kulüpte aynı isim var mı kontrol eder


        if (nameExists) // başka kulüp aynı isme sahipse
        {
            throw new InvalidOperationException(
                "Bu isimde başka bir kulüp zaten bulunuyor."
            ); // aynı isimde iki kulüp oluşmasını engeller
        }


        club.Name = clubName; // kulübün adını yeni değerle günceller

        club.Description = NormalizeOptionalText(
            request.Description
        ); // açıklamayı temizleyip günceller

        club.LogoUrl = NormalizeOptionalText(
            request.LogoUrl
        ); // logo adresini temizleyip günceller


        await clubRepository.SaveChangesAsync(
            cancellationToken
        ); // EF Coreun takip ettiği değişiklikleri PostgreSQL veritabanına kaydeder


        return MapToResponse(club); // güncellenen kulübü ClubResponsea çevirip döndürür
    }



    public async Task<bool> DeleteAsync(
        int id, // silinecek kulübün idsini alır
        string managerUserId, // silme işlemini yapan yöneticinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var club = await clubRepository.GetByIdAsync(
            id,
            cancellationToken
        ); // silinecek kulübü etkinlikleriyle beraber veritabanından getirir


        if (club is null) // kulüp bulunamazsa
        {
            return false; // silme işleminin başarısız olduğunu döndürür
        }


        if (club.ManagerUserId != managerUserId) // işlemi yapan kişi bu kulübün yöneticisi mi kontrol eder
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi yönettiğiniz kulübü silebilirsiniz."
            ); // başka yöneticinin kulübünü silmesini engeller
        }


        if (club.Events.Count > 0) // kulübün en az bir etkinliği varsa
        {
            throw new InvalidOperationException(
                "Etkinliği bulunan bir kulüp silinemez."
            ); // etkinliği bulunan kulübün silinmesini iş kuralı olarak engeller
        }


        clubRepository.Remove(club); // kulübü silinmek üzere EF Coreda işaretler


        await clubRepository.SaveChangesAsync(
            cancellationToken
        ); // silme işlemini gerçekten PostgreSQL veritabanına uygular


        return true; // kulübün başarıyla silindiğini belirtir
    }



    private static ClubResponse MapToResponse(Club club) // Club modelini frontend'e gönderilecek ClubResponse DTOsuna çevirir
    {
        return new ClubResponse
        {
            Id = club.Id, // kulüp idsi
            Name = club.Name, // kulüp adı
            Description = club.Description, // kulüp açıklaması
            LogoUrl = club.LogoUrl, // kulüp logo adresi
            ManagerUserId = club.ManagerUserId, // kulüp yöneticisinin kullanıcı idsi

            ManagerFullName =
                club.ManagerUser?.FullName
                ?? string.Empty,
            // yönetici bilgisi varsa ad soyadını alır, yoksa boş string döndürür

            EventCount = club.Events.Count // kulübün toplam etkinlik sayısını hesaplar
        };
    }



    private static string? NormalizeOptionalText(
        string? value // temizlenecek isteğe bağlı metni alır
    )
    {
        return string.IsNullOrWhiteSpace(value)
            ? null // değer boş veya sadece boşluksa null döndürür
            : value.Trim(); // değer doluysa başındaki ve sonundaki boşlukları temizler
    }
}

