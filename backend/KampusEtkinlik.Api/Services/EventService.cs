 
using KampusEtkinlik.Api.DTOs.Events; // Event request response ve popular event DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Enums; // EventStatus EventVisibility ve RegistrationApprovalStatus enumlarına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Event modeline erişmemizi sağlar
using KampusEtkinlik.Api.Repositories; // Event ve Club repositorylerine erişmemizi sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir


public sealed class EventService(
    IEventRepository eventRepository, // etkinlik veritabanı işlemlerini yapmak için repositoryi DI üzerinden alır
    IClubRepository clubRepository // etkinliğin bağlı olacağı kulübü ve yöneticisini kontrol etmek için club repositoryi alır
) : IEventService // IEventServicede tanımlanan etkinlik iş kurallarını gerçekleştirir
{


    public async Task<IReadOnlyList<EventResponse>> GetAllAsync(
        CancellationToken cancellationToken = default
    )
    {
        var events = await eventRepository.GetAllAsync(
            cancellationToken
        ); // tüm etkinlikleri repository üzerinden veritabanından getirir


        return events
            .Select(MapToResponse) // her Event modelini frontend için EventResponse DTOsuna çevirir
            .ToList(); // sonuçları liste haline getirir
    }



    public async Task<IReadOnlyList<PopularEventResponse>> GetPopularAsync(
        int limit, // frontendin istediği maksimum etkinlik sayısını alır
        CancellationToken cancellationToken = default
    )
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        // limit değerini en az 1 en fazla 50 olacak şekilde sınırlar


        var events = await eventRepository.GetPopularAsync(
            safeLimit,
            cancellationToken
        ); // popüler etkinlikleri repository üzerinden getirir


        return events
            .Select(MapToPopularResponse) // her etkinliği popüler etkinlik responseuna çevirir
            .ToList(); // sonuçları liste haline getirir
    }



    public async Task<EventResponse?> GetByIdAsync(
        int id, // getirilecek etkinliğin idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(
            id,
            cancellationToken
        ); // verilen idye sahip etkinliği repository üzerinden getirir


        return eventItem is null
            ? null // etkinlik bulunamazsa null döndürür
            : MapToResponse(eventItem); // bulunursa EventResponsea çevirip döndürür
    }



    public async Task<EventResponse> CreateAsync(
        string managerUserId, // etkinliği oluşturan kulüp yöneticisinin kullanıcı idsini alır
        CreateEventRequest request, // frontendden gelen etkinlik oluşturma bilgilerini alır
        CancellationToken cancellationToken = default
    )
    {
        ValidateRequest(
            request.Title,
            request.Description,
            request.StartDate,
            request.Location,
            request.Capacity,
            request.Category,
            request.Visibility
        ); // gelen etkinlik bilgilerinin iş kurallarına uygun olup olmadığını kontrol eder


        var club = await clubRepository.GetByIdAsync(
            request.ClubId,
            cancellationToken
        ); // etkinliğin bağlanacağı kulübü veritabanından getirir


        if (club is null) // belirtilen kulüp bulunamazsa
        {
            throw new KeyNotFoundException(
                "Etkinliğin bağlanacağı kulüp bulunamadı."
            ); // olmayan kulübe etkinlik eklenmesini engeller
        }


        if (club.ManagerUserId != managerUserId) // giriş yapan kullanıcı bu kulübün yöneticisi mi kontrol eder
        {
            throw new UnauthorizedAccessException(
                "Yalnızca yönettiğiniz kulübe etkinlik ekleyebilirsiniz."
            ); // başka yöneticinin kulübüne etkinlik eklenmesini engeller
        }


        var eventItem = new Event // gelen request bilgileriyle yeni Event nesnesi oluşturur
        {
            ClubId = request.ClubId, // etkinliği seçilen kulübe bağlar

            Title = request.Title.Trim(), // başlıktaki gereksiz boşlukları temizler

            Description = request.Description.Trim(), // açıklamadaki gereksiz boşlukları temizler

            StartDate = request.StartDate.ToUniversalTime(), // etkinlik tarihini UTCye çevirerek kaydeder

            Location = request.Location.Trim(), // konum bilgisindeki gereksiz boşlukları temizler

            Capacity = request.Capacity, // etkinliğin kapasitesini kaydeder

            Category = request.Category.Trim(), // kategori bilgisindeki gereksiz boşlukları temizler

            Visibility = request.Visibility, // etkinliğin Public veya ApprovalRequired tipini kaydeder

            Status = EventStatus.Active, // yeni etkinliği varsayılan olarak Active oluşturur

            CreatedAt = DateTimeOffset.UtcNow // oluşturulma tarihini UTC olarak kaydeder
        };


        await eventRepository.AddAsync(
            eventItem,
            cancellationToken
        ); // etkinliği EF Core tarafında eklenmek üzere hazırlar


        await eventRepository.SaveChangesAsync(
            cancellationToken
        ); // etkinliği gerçekten PostgreSQL veritabanına kaydeder


        var createdEvent =
            await eventRepository.GetByIdAsync(
                eventItem.Id,
                cancellationToken
            ); // kaydedilen etkinliği kulüp bilgisiyle beraber tekrar veritabanından getirir


        if (createdEvent is null) // oluşturulan etkinlik tekrar okunamazsa
        {
            throw new InvalidOperationException(
                "Etkinlik oluşturuldu ancak tekrar okunamadı."
            ); // beklenmeyen veri erişim hatasında işlemi durdurur
        }


        return MapToResponse(createdEvent); // oluşturulan Event modelini EventResponsea çevirip döndürür
    }



    public async Task<EventResponse?> UpdateAsync(
        int id, // güncellenecek etkinliğin idsini alır
        string managerUserId, // güncelleme işlemini yapan yöneticinin kullanıcı idsini alır
        UpdateEventRequest request, // frontendden gelen yeni etkinlik bilgilerini alır
        CancellationToken cancellationToken = default
    )
    {
        ValidateRequest(
            request.Title,
            request.Description,
            request.StartDate,
            request.Location,
            request.Capacity,
            request.Category,
            request.Visibility
        ); // yeni bilgilerin iş kurallarına uygun olup olmadığını kontrol eder


        var eventItem = await eventRepository.GetByIdAsync(
            id,
            cancellationToken
        ); // güncellenecek etkinliği kulüp bilgisiyle beraber getirir


        if (eventItem is null) // etkinlik bulunamazsa
        {
            return null;
        }


        if (eventItem.Club.ManagerUserId != managerUserId) // etkinliğin kulübünü yöneten kişi işlemi yapan kullanıcı mı kontrol eder
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi kulübünüze ait etkinliği güncelleyebilirsiniz."
            ); // başka yöneticinin etkinliğini güncellemeyi engeller
        }


        if (eventItem.Status == EventStatus.Cancelled) // etkinlik daha önce iptal edilmiş mi kontrol eder
        {
            throw new InvalidOperationException(
                "İptal edilmiş bir etkinlik güncellenemez."
            ); // iptal edilmiş etkinlik üzerinde değişiklik yapılmasını engeller
        }


        eventItem.Title = request.Title.Trim(); // etkinliğin başlığını günceller

        eventItem.Description = request.Description.Trim(); // etkinliğin açıklamasını günceller

        eventItem.StartDate = request.StartDate.ToUniversalTime(); // yeni tarihi UTCye çevirerek günceller

        eventItem.Location = request.Location.Trim(); // etkinlik konumunu günceller

        eventItem.Capacity = request.Capacity; // etkinlik kapasitesini günceller

        eventItem.Category = request.Category.Trim(); // kategori bilgisini günceller

        eventItem.Visibility = request.Visibility; // kayıt tipini Public veya ApprovalRequired olarak günceller


        await eventRepository.SaveChangesAsync(
            cancellationToken
        ); // EF Coreun takip ettiği değişiklikleri veritabanına kaydeder


        return MapToResponse(eventItem); // güncellenen etkinliği EventResponsea çevirip döndürür
    }



    public async Task<EventResponse?> CancelAsync(
        int id, // iptal edilecek etkinliğin idsini alır
        string managerUserId, // iptal işlemini yapan yöneticinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(
            id,
            cancellationToken
        ); // iptal edilecek etkinliği veritabanından getirir


        if (eventItem is null) // etkinlik bulunamazsa
        {
            return null;
        }


        if (eventItem.Club.ManagerUserId != managerUserId) // etkinliğin bağlı olduğu kulübün yöneticisini kontrol eder
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi kulübünüze ait etkinliği iptal edebilirsiniz."
            ); // başka yöneticinin etkinliğini iptal etmesini engeller
        }


        if (eventItem.Status == EventStatus.Cancelled) // etkinlik zaten iptal edilmiş mi kontrol eder
        {
            throw new InvalidOperationException(
                "Etkinlik zaten iptal edilmiş."
            ); // aynı etkinliğin tekrar iptal edilmesini engeller
        }


        eventItem.Status = EventStatus.Cancelled;
        // etkinliği veritabanından silmek yerine durumunu Cancelled yapar


        await eventRepository.SaveChangesAsync(
            cancellationToken
        ); // durum değişikliğini PostgreSQL veritabanına kaydeder


        return MapToResponse(eventItem); // iptal edilen etkinliğin güncel halini frontend'e döndürür
    }



    private static void ValidateRequest(
        string title, // kontrol edilecek etkinlik başlığı
        string description, // kontrol edilecek etkinlik açıklaması
        DateTimeOffset startDate, // kontrol edilecek etkinlik tarihi
        string location, // kontrol edilecek etkinlik konumu
        int capacity, // kontrol edilecek kapasite
        string category, // kontrol edilecek kategori
        EventVisibility visibility // kontrol edilecek etkinlik görünürlüğü
    )
    {
        if (string.IsNullOrWhiteSpace(title)) // başlık boş veya sadece boşluk mu kontrol eder
        {
            throw new ArgumentException(
                "Etkinlik başlığı boş bırakılamaz."
            );
        }


        if (string.IsNullOrWhiteSpace(description)) // açıklama boş veya sadece boşluk mu kontrol eder
        {
            throw new ArgumentException(
                "Etkinlik açıklaması boş bırakılamaz."
            );
        }


        if (string.IsNullOrWhiteSpace(location)) // konum boş veya sadece boşluk mu kontrol eder
        {
            throw new ArgumentException(
                "Etkinlik konumu boş bırakılamaz."
            );
        }


        if (string.IsNullOrWhiteSpace(category)) // kategori boş veya sadece boşluk mu kontrol eder
        {
            throw new ArgumentException(
                "Etkinlik kategorisi boş bırakılamaz."
            );
        }


        if (capacity <= 0) // kapasite sıfır veya negatif mi kontrol eder
        {
            throw new ArgumentException(
                "Etkinlik kontenjanı sıfırdan büyük olmalıdır."
            );
        }


        if (startDate.ToUniversalTime() <= DateTimeOffset.UtcNow) // etkinlik tarihi geçmişte veya şu anda mı kontrol eder
        {
            throw new ArgumentException(
                "Etkinlik tarihi gelecekte olmalıdır."
            ); // sadece gelecekteki tarihlerde etkinlik oluşturulmasına veya güncellenmesine izin verir
        }


        if (!Enum.IsDefined(visibility)) // gönderilen visibility değeri EventVisibility enumunda tanımlı mı kontrol eder
        {
            throw new ArgumentException(
                "Geçersiz etkinlik görünürlüğü."
            ); // tanımsız enum değerlerinin kullanılmasını engeller
        }
    }



    private static EventResponse MapToResponse(
        Event eventItem // dönüştürülecek Event modelini alır
    )
    {
        return new EventResponse // Event modelini frontend'e uygun EventResponse DTOsuna çevirir
        {
            Id = eventItem.Id, // etkinlik idsi

            ClubId = eventItem.ClubId, // bağlı olduğu kulübün idsi

            ClubName = eventItem.Club?.Name ?? string.Empty,
            // ilişkili kulüp varsa adını alır yoksa boş string kullanır

            Title = eventItem.Title, // etkinlik başlığı

            Description = eventItem.Description, // etkinlik açıklaması

            StartDate = eventItem.StartDate, // etkinlik başlangıç tarihi

            Location = eventItem.Location, // etkinlik konumu

            Capacity = eventItem.Capacity, // etkinlik kapasitesi

            Category = eventItem.Category, // etkinlik kategorisi

            Visibility = eventItem.Visibility, // Public veya ApprovalRequired bilgisi

            Status = eventItem.Status, // Active veya Cancelled bilgisi

            CreatedAt = eventItem.CreatedAt // etkinliğin oluşturulma tarihi
        };
    }



    private static PopularEventResponse MapToPopularResponse(
        Event eventItem // popüler etkinlik responseuna dönüştürülecek Event modelini alır
    )
    {
        var approvedRegistrationCount =
            eventItem.Registrations.Count(registration =>
                registration.ApprovalStatus
                == RegistrationApprovalStatus.Approved
            );
        // etkinliğin Approved durumundaki kayıtlarını sayar


        var remainingCapacity = Math.Max(
            eventItem.Capacity - approvedRegistrationCount,
            0
        );
        // kapasiteden onaylı kayıtları çıkararak kalan kontenjanı hesaplar, sonucun negatif olmasını engeller


        var registrationRate =
            eventItem.Capacity > 0 // kapasite varsa kayıt oranını hesaplar
                ? Math.Round(
                    approvedRegistrationCount
                    * 100.0
                    / eventItem.Capacity,
                    2
                ) // Approved kayıtların kapasiteye göre yüzdesini hesaplar ve 2 basamağa yuvarlar
                : 0; // kapasite 0 ise sıfıra bölmeyi engeller


        return new PopularEventResponse // hesaplanan bilgileri frontend'e uygun responsea dönüştürür
        {
            Id = eventItem.Id, // etkinlik idsi

            ClubId = eventItem.ClubId, // kulüp idsi

            ClubName = eventItem.Club?.Name ?? string.Empty, // kulüp adı

            Title = eventItem.Title, // etkinlik başlığı

            StartDate = eventItem.StartDate, // etkinlik başlangıç tarihi

            Location = eventItem.Location, // etkinlik konumu

            Category = eventItem.Category, // etkinlik kategorisi

            Visibility = eventItem.Visibility, // kayıt tipi

            Capacity = eventItem.Capacity, // etkinlik kapasitesi

            ApprovedRegistrationCount =
                approvedRegistrationCount, // onaylanmış kayıt sayısı

            RemainingCapacity = remainingCapacity, // kalan boş kontenjan

            RegistrationRate = registrationRate // etkinliğin doluluk oranı
        };
    }
}
 
