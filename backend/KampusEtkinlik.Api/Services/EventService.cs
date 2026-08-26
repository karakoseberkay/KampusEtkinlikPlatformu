 
using KampusEtkinlik.Api.DTOs.Events; // Event request response ve popular event DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Enums; // EventStatus EventVisibility ve RegistrationApprovalStatus enumlarına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // Event modeline erişmemizi sağlar
using KampusEtkinlik.Api.Repositories; // Event ve Club repositorylerine erişmemizi sağlar
using KampusEtkinlik.Api.DTOs.Common; // Sayfalama sonucunu frontend'e göndermek için PagedResponse DTOsuna erişmemizi sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir


public sealed class EventService(
    IEventRepository eventRepository, // etkinlik veritabanı işlemlerini yapmak için repositoryi DI üzerinden alır
    IClubRepository clubRepository // etkinliğin bağlı olacağı kulübü ve yöneticisini kontrol etmek için club repositoryi alır
) : IEventService // IEventServicede tanımlanan etkinlik iş kurallarını gerçekleştirir
{


    public async Task<IReadOnlyList<EventResponse>> GetAllAsync(
        CancellationToken cancellationToken = default){
    
    
        var events = await eventRepository.GetAllAsync(cancellationToken);            
         // tüm etkinlikleri repository üzerinden veritabanından getirir


        return events.Select(MapToResponse).ToList();
             // her Event modelini frontend için EventResponse DTOsuna çevirir
            // sonuçları liste haline getirir
    }



    public async Task<IReadOnlyList<PopularEventResponse>> GetPopularAsync(
        int limit, // frontendin istediği maksimum etkinlik sayısını alır
        CancellationToken cancellationToken = default
    )
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        // limit değerini en az 1 en fazla 50 olacak şekilde sınırlar(önlem)


        var events = await eventRepository.GetPopularAsync(safeLimit,cancellationToken);
                        
         // popüler etkinlikleri repository üzerinden getirir


        return events.Select(MapToPopularResponse).ToList();
             // her etkinliği popüler etkinlik responseuna çevirir
             // sonuçları liste haline getirir
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


        return eventItem is null ? null : MapToResponse(eventItem);
            // etkinlik bulunamazsa null döndürür
            // bulunursa EventResponsea çevirip döndürür
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
                "The club for this event was not found."
            ); // olmayan kulübe etkinlik eklenmesini engeller(önlem)
        }


        if (club.ManagerUserId != managerUserId) // giriş yapan kullanıcı bu kulübün yöneticisi mi kontrol eder
        {
            throw new UnauthorizedAccessException(
                "You can only add events to clubs you manage."
            ); // başka yöneticinin kulübüne etkinlik eklenmesini engeller(önlem)()403
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


        await eventRepository.SaveChangesAsync(cancellationToken);
            
         // etkinliği gerçekten PostgreSQL veritabanına kaydeder


        var createdEvent = await eventRepository.GetByIdAsync(
            
                eventItem.Id,
                cancellationToken
            ); // kaydedilen etkinliği kulüp bilgisiyle beraber tekrar veritabanından getirir(önlem)


        if (createdEvent is null) // oluşturulan etkinlik tekrar okunamazsa
        {
            throw new InvalidOperationException("The event was created but could not be retrieved.");                
             // beklenmeyen veri erişim hatasında işlemi durdurur
        }


        return MapToResponse(createdEvent); // oluşturulan Event modelini EventResponsa çevirip döndürür
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
        ); // yeni bilgilerin iş kurallarına uygun olup olmadığını kontrol eder (aşağıki satırlarda)


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
            throw new UnauthorizedAccessException("You can only update events belonging to your own club.");                
             // başka yöneticinin etkinliğini güncellemeyi engeller(önlem)
        }


        if (eventItem.Status == EventStatus.Cancelled) // etkinlik daha önce iptal edilmiş mi kontrol eder
        {
            throw new InvalidOperationException("A cancelled event cannot be updated.");                
             // iptal edilmiş etkinlik üzerinde değişiklik yapılmasını engeller
        }


        eventItem.Title = request.Title.Trim(); // etkinliğin başlığını günceller

        eventItem.Description = request.Description.Trim(); // etkinliğin açıklamasını günceller

        eventItem.StartDate = request.StartDate.ToUniversalTime(); // yeni tarihi UTCye çevirerek günceller

        eventItem.Location = request.Location.Trim(); // etkinlik konumunu günceller

        eventItem.Capacity = request.Capacity; // etkinlik kapasitesini günceller

        eventItem.Category = request.Category.Trim(); // kategori bilgisini günceller

        eventItem.Visibility = request.Visibility; // kayıt tipini Public veya ApprovalRequired olarak günceller


        await eventRepository.SaveChangesAsync(cancellationToken);            
         // EF Coreun takip ettiği değişiklikleri veritabanına kaydeder


        return MapToResponse(eventItem); // güncellenen etkinliği EventResponsea çevirip döndürür
    }



    public async Task<EventResponse?> CancelAsync(
        int id, // iptal edilecek etkinliğin idsini alır
        string managerUserId, // iptal işlemini yapan yöneticinin kullanıcı idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(id, cancellationToken);
         // iptal edilecek etkinliği veritabanından getirir


        if (eventItem is null) // etkinlik bulunamazsa
        {
            return null;
        }


        if (eventItem.Club.ManagerUserId != managerUserId) // etkinliğin bağlı olduğu kulübün yöneticisini kontrol eder(önlem)
        {
            throw new UnauthorizedAccessException("You can only cancel events belonging to your own club.");                
             // başka yöneticinin etkinliğini iptal etmesini engeller
        }


        if (eventItem.Status == EventStatus.Cancelled) // etkinlik zaten iptal edilmiş mi kontrol eder
        {
            throw new InvalidOperationException( "The event has already been cancelled.");               
             // aynı etkinliğin tekrar iptal edilmesini engeller
        }


        eventItem.Status = EventStatus.Cancelled;
        // etkinliği veritabanından silmek yerine durumunu Cancelled yapar


        await eventRepository.SaveChangesAsync(cancellationToken);             
        // durum değişikliğini PostgreSQL veritabanına kaydeder


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
            throw new ArgumentException("Event title cannot be empty." );       
            
        }


        if (string.IsNullOrWhiteSpace(description)) // açıklama boş veya sadece boşluk mu kontrol eder
        {
            throw new ArgumentException("Event description cannot be empty.");
                
            
        }


        if (string.IsNullOrWhiteSpace(location)) // konum boş veya sadece boşluk mu kontrol eder
        {
            throw new ArgumentException("Event location cannot be empty.");
                
            
        }


        if (string.IsNullOrWhiteSpace(category)) // kategori boş veya sadece boşluk mu kontrol eder
        {
            throw new ArgumentException("Event category cannot be empty.");                
            
        }


        if (capacity <= 0) // kapasite sıfır veya negatif mi kontrol eder
        {
            throw new ArgumentException("Event capacity must be greater than zero.");
                            
        }


        if (startDate.ToUniversalTime() <= DateTimeOffset.UtcNow) // etkinlik tarihi geçmişte veya şu anda mı kontrol eder
        {
            throw new ArgumentException("Event date must be in the future.");
                
             // sadece gelecekteki tarihlerde etkinlik oluşturulmasına veya güncellenmesine izin verir (önlem)
        }


        if (!Enum.IsDefined(visibility)) // gönderilen visibility değeri EventVisibility enumunda tanımlı mı kontrol eder
        {
            throw new ArgumentException("Invalid event visibility.");
                
             // tanımsız enum değerlerinin kullanılmasını engeller(önlem)
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
                registration.ApprovalStatus == RegistrationApprovalStatus.Approved);
                
            
        // etkinliğin Approved durumundaki kayıtlarını sayar


        var remainingCapacity = Math.Max(eventItem.Capacity - approvedRegistrationCount, 0);  //alt sınır 0                    
       
        // kapasiteden onaylı kayıtları çıkararak kalan kontenjanı hesaplar, sonucun negatif olmasını engeller


        var registrationRate =
            eventItem.Capacity > 0 ? Math.Round(approvedRegistrationCount * 100.0 / eventItem.Capacity, 2): 0;//(divisionbyzero)
                // kapasite varsa kayıt oranını hesaplar    
                 // Approved kayıtların kapasiteye göre yüzdesini hesaplar ve 2 basamağa yuvarlar
                 // kapasite 0 ise sıfıra bölmeyi engeller


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

            ApprovedRegistrationCount = approvedRegistrationCount,
                 // onaylanmış kayıt sayısı

            RemainingCapacity = remainingCapacity, // kalan boş kontenjan

            RegistrationRate = registrationRate // etkinliğin doluluk oranı
        };
    }

    public async Task<PagedResponse<EventResponse>> GetPagedAsync(
    string? search, // Etkinliklerde yapılacak arama değerini alır, filtre gönderilmezse null olabilir
    string? category, // Etkinlikleri kategoriye göre filtrelemek için kullanılır
    int? clubId, // Sadece belirli bir kulübe ait etkinlikleri getirmek için kulüp idsini alır
    DateTimeOffset? dateFrom, // Bu tarihten sonraki etkinlikleri filtrelemek için kullanılır
    DateTimeOffset? dateTo, // Bu tarihe kadar olan etkinlikleri filtrelemek için kullanılır
    bool upcomingOnly, // True ise sadece yaklaşan etkinliklerin getirilmesini sağlar
    int page, // Frontendin istediği sayfa numarasını alır
    int pageSize, // Bir sayfada kaç etkinlik gösterileceğini alır
    CancellationToken cancellationToken = default // İstek iptal edilirse devam eden async işlemin durdurulabilmesini sağlar
)
{
    var safePage = Math.Max(page, 1);
    // Math.Max verilen iki değerden büyük olanı döndürür
    // Böylece frontend 0 veya negatif sayfa gönderse bile minimum 1. sayfanın kullanılmasını sağlar

    var safePageSize = Math.Clamp(pageSize, 1, 50);   
    // Math.Clamp pageSize değerini belirlediğimiz alt ve üst sınır arasında tutar
    // Örneğin 0 gönderilirse 1, 100 gönderilirse 50 olarak kullanılır
    // Böylece tek istekte gereğinden fazla kayıt çekilmesini engeller

    var result = await eventRepository.GetPagedAsync(
       
            search,
            category,
            clubId,
            dateFrom,
            dateTo,
            upcomingOnly,
            safePage,
            safePageSize,
            cancellationToken
        );
    // Filtreleri ve güvenli hale getirilen sayfalama bilgilerini repository katmanına gönderir
    // Repository veritabanı sorgusunu yaparak o sayfadaki kayıtları ve toplam kayıt sayısını döndürür

    var totalPages = result.TotalCount == 0 ? 0 : (int)Math.Ceiling(result.TotalCount / (double)safePageSize);
       
    // Hiç kayıt yoksa toplam sayfa sayısını 0 yapar
    // Kayıt varsa toplam kayıt sayısını sayfa boyutuna bölerek kaç sayfa gerektiğini hesaplar
    // (double) dönüşümü bölme işleminin ondalıklı yapılmasını sağlar
    // Math.Ceiling sonucu yukarı yuvarlar, örneğin 21 kayıt ve 10 pageSize varsa 3 sayfa oluşturur
    // Sonuç double döndüğü için (int) ile tam sayıya çevirir

    return new PagedResponse<EventResponse>
    {
        Items = result.Items.Select(MapToResponse).ToList(),
        // Repositoryden gelen Event modellerini MapToResponse ile EventResponse DTOlarına çevirir
        // Select her kayıt üzerinde MapToResponse metodunu çalıştırır ve ToList ile liste haline getirir

        Page = safePage, // Frontend'e kullanılan güncel sayfa numarasını döndürür

        PageSize = safePageSize, // Bir sayfada kullanılan kayıt sayısını döndürür

        TotalCount = result.TotalCount, // Filtrelere uygun toplam etkinlik sayısını döndürür

        TotalPages = totalPages // Hesaplanan toplam sayfa sayısını frontend'e döndürür
    };
}}
 
