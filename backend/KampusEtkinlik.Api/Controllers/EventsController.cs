using System.Security.Claims; // JWT doğrulandıktan sonra kullanıcı id gibi claim bilgilerini okumamızı sağlar
using KampusEtkinlik.Api.Constants; // RoleNames.ClubManager gibi rol sabitlerine erişmemizi sağlar
using KampusEtkinlik.Api.DTOs.Common; // PagedResponse gibi ortak response DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.DTOs.Events; // Event request ve response DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Services; // IEventService üzerinden etkinlik iş mantığına erişmemizi sağlar
using Microsoft.AspNetCore.Authorization; // Authorize ve AllowAnonymous attributelarını kullanmamızı sağlar
using Microsoft.AspNetCore.Mvc; // ControllerBase route HTTP method ve response yapılarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Controllers; // Bu dosyanın Controllers katmanına ait olduğunu belirtir

[ApiController] // Bu sınıfın HTTP isteklerini karşılayan bir API controllerı olduğunu belirtir
[Route("api/[controller]")] // Controllerın ana routeunu /api/Events olarak oluşturur
[Authorize] // Controllerdaki endpointlere varsayılan olarak geçerli JWT ile giriş yapılmasını zorunlu tutar
public sealed class EventsController(IEventService eventService) : ControllerBase
{
    // Etkinlik iş kurallarını çalıştırmak için IEventService'i DI üzerinden alır

    [HttpGet] // GET /api/Events endpointini oluşturur
    public async Task<ActionResult<IReadOnlyList<EventResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var events = await eventService.GetAllAsync(cancellationToken);
        // Tüm etkinlikleri service üzerinden getirir

        return Ok(events); // Etkinlikleri 200 OK ile frontend'e döndürür
    }

    [HttpGet("paged")] // GET /api/Events/paged endpointini oluşturur
    public async Task<ActionResult<PagedResponse<EventResponse>>> GetPaged(
        [FromQuery] string? search, // URLdeki search query parametresini alır, gönderilmezse null olabilir
        [FromQuery] string? category, // Etkinlikleri kategoriye göre filtrelemek için kullanılan query parametresini alır
        [FromQuery] int? clubId, // Belirli bir kulübün etkinliklerini filtrelemek için kulüp IDsini alır
        [FromQuery] DateTimeOffset? dateFrom, // Başlangıç tarihi filtresini alır, ? sayesinde boş bırakılabilir
        [FromQuery] DateTimeOffset? dateTo, // Bitiş tarihi filtresini alır, gönderilmezse null olabilir
        [FromQuery] bool upcomingOnly = false, // Sadece yaklaşan etkinliklerin istenip istenmediğini belirtir
        [FromQuery] string? sortField = null, // hangi etkinlik alanına göre sıralama yapılacağını URLden alır
        [FromQuery] string? sortDirection = null, // sıralamanın asc veya desc olacağını URLden alır
        [FromQuery] int page = 1, // İstenen sayfa numarasını alır, gönderilmezse ilk sayfa kullanılır
        [FromQuery] int pageSize = 10, // Bir sayfada kaç etkinlik olacağını alır, varsayılan olarak 10 kullanılır
        CancellationToken cancellationToken = default // İstek iptal edilirse devam eden async işlemlerin durdurulabilmesini sağlar
    )
    {
        if (dateFrom.HasValue && dateTo.HasValue && dateFrom.Value > dateTo.Value)
        // Her iki tarih de gönderildiyse başlangıç tarihinin bitiş tarihinden sonra olup olmadığını kontrol eder
        {
            return BadRequest(new{
                    message = "Start date cannot be after end date."
                }
            ); // Geçersiz tarih aralığında 400 Bad Request döndürür
        }

        var result = await eventService.GetPagedAsync(
            search,
            category,
            clubId,
            dateFrom,
            dateTo,
            upcomingOnly,
            sortField,
            sortDirection,
            page,
            pageSize,
            cancellationToken
        );
        // Frontendden gelen filtre sıralama ve sayfalama bilgilerini service katmanına gönderir
        // Service sonucunda etkinlik listesiyle birlikte toplam kayıt ve sayfa bilgileri gelir

        return Ok(result); // Sayfalı etkinlik sonucunu 200 OK ile frontend'e döndürür
    }

    [HttpGet("popular")] // GET /api/Events/popular endpointini oluşturur
    [AllowAnonymous] // Controllerda Authorize olsa bile bu endpointin JWT olmadan kullanılmasına izin verir
    public async Task<ActionResult<IReadOnlyList<PopularEventResponse>>> GetPopular(
        [FromQuery] int limit = 10, // limit query parametresini alır, gönderilmezse 10 kullanır
        CancellationToken cancellationToken = default
    )
    {
        var events = await eventService.GetPopularAsync(limit, cancellationToken);
         // İstenen limit değerine göre popüler etkinlikleri service üzerinden getirir

        return Ok(events); // Popüler etkinlikleri 200 OK ile döndürür
    }

    [HttpGet("{id:int}")] // GET /api/Events/5 gibi idye göre etkinlik getiren endpointi oluşturur
    public async Task<ActionResult<EventResponse>> GetById(
        int id, // Routetan gelen etkinlik idsini alır
        CancellationToken cancellationToken
    )
    {
        var eventItem = await eventService.GetByIdAsync(id, cancellationToken);
         // Verilen idye sahip etkinliği service üzerinden getirir

        if (eventItem is null) // Etkinlik bulunamazsa
        {
            return NotFound(new
                {
                    message = "Event not found."
                }
            ); // 404 Not Found döndürür
        }

        return Ok(eventItem); // Etkinlik bulunduysa 200 OK ile döndürür
    }

    [HttpPost] // POST /api/Events endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)]
    // Sadece ClubManager rolündeki kullanıcıların etkinlik oluşturmasına izin verir
    public async Task<ActionResult<EventResponse>> Create(
        [FromBody] CreateEventRequest request, // Frontendden gönderilen JSON etkinlik bilgilerini request DTOsuna dönüştürür
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // Giriş yapan ClubManagerın kullanıcı idsini JWT claimlerinden alır

        if (managerUserId is null) // Tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(new
                
                {
                    message = "User identity could not be found in the token."
                }
            ); // 401 Unauthorized döndürür
        }

        try
        {
            var eventItem = await eventService.CreateAsync(
                managerUserId,
                request,
                cancellationToken
            );
            // JWTden gelen yönetici idsi ve request bilgileriyle etkinliği service üzerinden oluşturur

            return CreatedAtAction(
                nameof(GetById), // Oluşturulan etkinliğin tekrar alınabileceği endpointi belirtir
                new { id = eventItem.Id }, // Oluşturulan etkinliğin idsini route parametresi olarak verir
                eventItem // Oluşturulan etkinlik bilgisini response bodyde döndürür
            );
            // Başarılı oluşturma işleminde 201 Created döndürür
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new { message = exception.Message }
            );
            // Tarih kapasite başlık gibi geçersiz bilgilerde 400 Bad Request döndürür
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new { message = exception.Message }
            );
            // Etkinliğin bağlanacağı kulüp bulunamazsa 404 Not Found döndürür
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
            // Yönetici kendi yönetmediği kulübe etkinlik eklemeye çalışırsa 403 Forbidden döndürür
        }
    }

    [HttpPut("{id:int}")] // PUT /api/Events/5 endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)]
    // Sadece ClubManager rolündeki kullanıcıların etkinlik güncellemesine izin verir
    public async Task<ActionResult<EventResponse>> Update(
        int id, // Güncellenecek etkinliğin idsini routetan alır
        [FromBody] UpdateEventRequest request, // Yeni etkinlik bilgilerini request bodyden alır
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // Güncelleme işlemini yapan yöneticinin idsini JWTden alır

        if (managerUserId is null) // Tokenda kullanıcı idsi yoksa
        {
            return Unauthorized(new
                
                {
                    message = "User identity could not be found in the token."
                }
            ); // 401 Unauthorized döndürür
        }

        try
        {
            var eventItem = await eventService.UpdateAsync(
                id,
                managerUserId,
                request,
                cancellationToken
            );
            // Etkinlik idsini yönetici idsini ve yeni bilgileri service gönderir

            if (eventItem is null) // Güncellenecek etkinlik bulunamazsa
            {
                return NotFound(
                    new { message = "Event not found." }
                ); // 404 Not Found döndürür
            }

            return Ok(eventItem); // Güncellenen etkinliği 200 OK ile döndürür
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new { message = exception.Message }
            );
            // Geçersiz etkinlik bilgileri gönderilirse 400 Bad Request döndürür
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
            // Kullanıcı başka yöneticinin etkinliğini güncellemeye çalışırsa 403 Forbidden döndürür
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new { message = exception.Message }
            );
            // İptal edilmiş etkinliği güncelleme gibi iş kuralı çakışmalarında 409 Conflict döndürür
        }
    }

    [HttpPut("{id:int}/cancel")] // PUT /api/Events/5/cancel endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] // Sadece ClubManager rolündeki kullanıcıların etkinlik iptal etmesine izin verir
    public async Task<ActionResult<EventResponse>> Cancel(
        int id, // İptal edilecek etkinliğin idsini routetan alır
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // İptal işlemini yapan yöneticinin kullanıcı idsini JWTden alır

        if (managerUserId is null) // Tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(new
                
                {
                    message = "User identity could not be found in the token."
                }
            ); // 401 Unauthorized döndürür
        }

        try
        {
            var eventItem = await eventService.CancelAsync(
                id,
                managerUserId,
                cancellationToken
            );
            // Etkinliği service üzerinden fiziksel olarak silmeden Cancelled durumuna geçirir

            if (eventItem is null) // Etkinlik bulunamazsa
            {
                return NotFound(
                    new { message = "Event not found." }
                ); // 404 Not Found döndürür
            }

            return Ok(eventItem); // İptal edilen etkinliğin güncel halini 200 OK ile döndürür
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
            // Kullanıcı başka yöneticinin etkinliğini iptal etmeye çalışırsa 403 Forbidden döndürür
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new { message = exception.Message }
            );
            // Etkinlik zaten iptal edilmişse 409 Conflict döndürür
        }
    }

    private string? GetCurrentUserId() // Giriş yapan kullanıcının idsini JWT claimlerinden alan yardımcı metottur
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier ?? User.FindFirstValue("sub"));

        // Önce NameIdentifier claimindeki kullanıcı idsini arar
        // Bulunamazsa standart JWT sub claiminden kullanıcı idsini almaya çalışır
    }
}