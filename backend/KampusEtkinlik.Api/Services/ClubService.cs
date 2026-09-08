using KampusEtkinlik.Api.DTOs.Clubs; // kulüp request response ve istatistik DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Enums; // EventStatus ve RegistrationApprovalStatus enumlarına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Club modeline erişmemizi sağlar
using KampusEtkinlik.Api.Repositories; // IClubRepository üzerinden kulüp veritabanı işlemlerine erişmemizi sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir

public sealed class ClubService(IClubRepository clubRepository) : IClubService
// kulüp veritabanı işlemlerini yapacak repositoryi DI üzerinden alır ve IClubServicedeki iş kurallarını gerçekleştirir
{
    public async Task<IReadOnlyList<ClubResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var clubs = await clubRepository.GetAllAsync(cancellationToken);
        // repository üzerinden tüm kulüpleri veritabanından getirir

        return clubs.Select(MapToResponse).ToList();
        // her Club modelini frontend için ClubResponse DTOsuna çevirip liste halinde döndürür
    }

    public async Task<ClubResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var club = await clubRepository.GetByIdAsync(id, cancellationToken);
        // verilen idye sahip kulübü repository üzerinden getirir

        return club is null ? null : MapToResponse(club);
        // kulüp bulunamadıysa null bulunduysa ClubResponsea çevirip döndürür
    }

    public async Task<ClubStatsResponse?> GetStatsAsync(int id, string managerUserId, CancellationToken cancellationToken = default)
    {
        var club = await clubRepository.GetByIdWithStatsAsync(id, cancellationToken);
        // kulübü etkinlikleri ve etkinlik kayıtlarıyla beraber getirir

        if (club is null)
        {
            return null;
        }

        if (club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException("You can only view statistics for clubs you manage.");
            // başka yöneticinin kulüp istatistiklerini görüntülemesini engeller
        }

        var eventStats = club.Events
            .OrderByDescending(eventItem => eventItem.StartDate) // etkinlikleri en yeni tarihten eskiye doğru sıralar
            .Select(eventItem =>
            {
                var approvedCount = eventItem.Registrations.Count(registration =>
                    registration.ApprovalStatus == RegistrationApprovalStatus.Approved);
                // etkinlikte Approved durumundaki kayıtların sayısını hesaplar

                var pendingCount = eventItem.Registrations.Count(registration =>
                    registration.ApprovalStatus == RegistrationApprovalStatus.Pending);
                // etkinlikte Pending durumundaki kayıtların sayısını hesaplar

                var rejectedCount = eventItem.Registrations.Count(registration =>
                    registration.ApprovalStatus == RegistrationApprovalStatus.Rejected);
                // etkinlikte Rejected durumundaki kayıtların sayısını hesaplar

                var registrationRate = eventItem.Capacity > 0
                    ? Math.Round(approvedCount * 100.0 / eventItem.Capacity, 2)
                    : 0;
                // onaylanan kayıtların kapasiteye göre yüzdesini hesaplar kapasite 0 ise divisionbyzero hatasını engeller

                return new ClubEventStatsResponse
                {
                    EventId = eventItem.Id, // etkinlik idsi
                    Title = eventItem.Title, // etkinlik başlığı
                    StartDate = eventItem.StartDate, // etkinlik başlangıç tarihi
                    Status = eventItem.Status, // etkinliğin Active veya Cancelled durumu
                    Capacity = eventItem.Capacity, // etkinliğin toplam kapasitesi
                    ApprovedRegistrationCount = approvedCount, // onaylanan kayıt sayısı
                    PendingRegistrationCount = pendingCount, // bekleyen kayıt sayısı
                    RejectedRegistrationCount = rejectedCount, // reddedilen kayıt sayısı
                    RegistrationRate = registrationRate // etkinliğin doluluk oranı
                };
            })
            .ToList();

        var totalCapacity = club.Events.Sum(eventItem => eventItem.Capacity);
        // kulübün bütün etkinliklerinin toplam kapasitesini hesaplar

        var totalApprovedCount = eventStats.Sum(eventItem => eventItem.ApprovedRegistrationCount);
        // bütün etkinliklerdeki toplam onaylanmış kayıt sayısını hesaplar

        var overallRegistrationRate = totalCapacity > 0
            ? Math.Round(totalApprovedCount * 100.0 / totalCapacity, 2)
            : 0;
        // toplam onaylı kayıtların toplam kapasiteye göre yüzdesini hesaplar

        var attendanceEvents = club.Events
            .Where(eventItem =>
                eventItem.Status != EventStatus.Cancelled &&
                eventItem.StartDate <= DateTimeOffset.UtcNow)
            .ToList();
        // sadece başlamış ve iptal edilmemiş etkinlikleri gerçek katılım hesabına dahil eder

        var attendanceEligibleCount = attendanceEvents.Sum(eventItem =>
            eventItem.Registrations.Count(registration =>
                registration.ApprovalStatus == RegistrationApprovalStatus.Approved));
        // katılım hesabına dahil edilen etkinliklerdeki toplam onaylı kayıt sayısını hesaplar

        var totalCheckedInCount = attendanceEvents.Sum(eventItem =>
            eventItem.Registrations.Count(registration =>
                registration.ApprovalStatus == RegistrationApprovalStatus.Approved &&
                registration.CheckedInAt.HasValue));
        // onaylı kaydı olup qr ile gerçekten check-in yapan kayıtların toplamını hesaplar

        var totalAbsentCount = Math.Max(0, attendanceEligibleCount - totalCheckedInCount);
        // onaylı kaydı olduğu halde qr ile check-in yapmayan kayıtların sayısını hesaplar

        var overallAttendanceRate = attendanceEligibleCount > 0
            ? Math.Round(totalCheckedInCount * 100.0 / attendanceEligibleCount, 2)
            : 0;
        // gerçekten katılanların katılım için değerlendirilen kayıtlar içerisindeki yüzdesini hesaplar

        return new ClubStatsResponse
        {
            ClubId = club.Id, // kulüp idsi
            ClubName = club.Name, // kulüp adı

            TotalEventCount = club.Events.Count, // kulübün toplam etkinlik sayısı

            ActiveEventCount = club.Events.Count(eventItem => eventItem.Status == EventStatus.Active),
            // aktif etkinliklerin sayısını hesaplar

            CancelledEventCount = club.Events.Count(eventItem => eventItem.Status == EventStatus.Cancelled),
            // iptal edilmiş etkinliklerin sayısını hesaplar

            TotalApprovedRegistrationCount = totalApprovedCount, // toplam onaylanan kayıt sayısı

            TotalPendingRegistrationCount = eventStats.Sum(eventItem => eventItem.PendingRegistrationCount),
            // bütün etkinliklerdeki toplam bekleyen kayıt sayısı

            TotalRejectedRegistrationCount = eventStats.Sum(eventItem => eventItem.RejectedRegistrationCount),
            // bütün etkinliklerdeki toplam reddedilen kayıt sayısı

            OverallRegistrationRate = overallRegistrationRate, // kulübün genel kayıt oranı

            TotalAttendanceEligibleRegistrationCount = attendanceEligibleCount,
            // başlamış etkinliklerdeki toplam onaylı kayıt sayısını döndürür

            TotalCheckedInRegistrationCount = totalCheckedInCount,
            // qr ile gerçekten katılım sağlayan kayıtların toplamını döndürür

            TotalAbsentRegistrationCount = totalAbsentCount,
            // kayıtlı olduğu halde check-in yapmayanların toplamını döndürür

            OverallAttendanceRate = overallAttendanceRate,
            // kulübün genel gerçek katılım yüzdesini döndürür

            Events = eventStats // etkinlik bazındaki detaylı istatistikleri ekler
        };
    }

    public async Task<ClubResponse> CreateAsync(string managerUserId, CreateClubRequest request, CancellationToken cancellationToken = default)
    {
        var clubName = request.Name.Trim(); // kulüp adının başındaki ve sonundaki boşlukları temizler

        if (string.IsNullOrWhiteSpace(clubName))
        {
            throw new ArgumentException("Club name cannot be empty.");
        }

        var nameExists = await clubRepository.NameExistsAsync(clubName, cancellationToken: cancellationToken);
        // aynı isimde başka kulüp var mı repository üzerinden kontrol eder

        if (nameExists)
        {
            throw new InvalidOperationException("A club with this name already exists.");
        }

        var club = new Club
        {
            Name = clubName,
            Description = NormalizeOptionalText(request.Description), // açıklama boşsa null yapar doluysa boşluklarını temizler
            LogoUrl = NormalizeOptionalText(request.LogoUrl), // logo adresi boşsa null yapar doluysa boşluklarını temizler
            ManagerUserId = managerUserId // giriş yapan yöneticiyi kulübün yöneticisi yapar
        };

        await clubRepository.AddAsync(club, cancellationToken);
        // kulübü eklenmek üzere DbContexte gönderir

        await clubRepository.SaveChangesAsync(cancellationToken);
        // yeni kulübü PostgreSQL veritabanına kaydeder

        var createdClub = await clubRepository.GetByIdAsync(club.Id, cancellationToken);
        // kaydedilen kulübü güncel bilgileriyle tekrar getirir

        if (createdClub is null)
        {
            throw new InvalidOperationException("The club was created but could not be retrieved.");
        }

        return MapToResponse(createdClub);
    }

    public async Task<ClubResponse?> UpdateAsync(int id, string managerUserId, UpdateClubRequest request, CancellationToken cancellationToken = default)
    {
        var club = await clubRepository.GetByIdAsync(id, cancellationToken);
        // güncellenecek kulübü veritabanından getirir

        if (club is null)
        {
            return null;
        }

        if (club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException("You can only update clubs you manage.");
        }

        var clubName = request.Name.Trim(); // yeni kulüp adının boşluklarını temizler

        if (string.IsNullOrWhiteSpace(clubName))
        {
            throw new ArgumentException("Club name cannot be empty.");
        }

        var nameExists = await clubRepository.NameExistsAsync(clubName, club.Id, cancellationToken);
        // mevcut kulübü hariç tutarak aynı isimde başka kulüp var mı kontrol eder

        if (nameExists)
        {
            throw new InvalidOperationException("Another club with this name already exists.");
        }

        club.Name = clubName;
        club.Description = NormalizeOptionalText(request.Description);
        club.LogoUrl = NormalizeOptionalText(request.LogoUrl);

        await clubRepository.SaveChangesAsync(cancellationToken);
        // değişiklikleri PostgreSQL veritabanına kaydeder

        return MapToResponse(club);
    }

    public async Task<bool> DeleteAsync(int id, string managerUserId, CancellationToken cancellationToken = default)
    {
        var club = await clubRepository.GetByIdAsync(id, cancellationToken);
        // silinecek kulübü etkinlikleriyle beraber getirir

        if (club is null)
        {
            return false;
        }

        if (club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException("You can only delete clubs you manage.");
        }

        if (club.Events.Count > 0)
        {
            throw new InvalidOperationException("A club with existing events cannot be deleted.");
            // etkinliği bulunan kulübün silinmesini engeller
        }

        clubRepository.Remove(club); // kulübü EF Core tarafında silinmek üzere işaretler

        await clubRepository.SaveChangesAsync(cancellationToken);
        // silme işlemini PostgreSQL veritabanına uygular

        return true;
    }

    private static ClubResponse MapToResponse(Club club)
    {
        return new ClubResponse
        {
            Id = club.Id, // kulüp idsi
            Name = club.Name, // kulüp adı
            Description = club.Description, // kulüp açıklaması
            LogoUrl = club.LogoUrl, // kulüp logo adresi
            ManagerUserId = club.ManagerUserId, // kulüp yöneticisinin kullanıcı idsi
            ManagerFullName = club.ManagerUser?.FullName ?? string.Empty, // yönetici varsa ad soyadını yoksa boş string döndürür
            EventCount = club.Events.Count // kulübün toplam etkinlik sayısını hesaplar
        };
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null // değer boş veya sadece boşluksa null döndürür
            : value.Trim(); // doluysa başındaki ve sonundaki boşlukları temizler
    }
}