using System.Security.Claims; // JWT doğrulandıktan sonra kullanıcı id gibi claim bilgilerini okumamızı sağlar
using KampusEtkinlik.Api.Constants; // RoleNames.ClubManager gibi rol sabitlerine erişmemizi sağlar
using KampusEtkinlik.Api.DTOs.Events; // Event request ve response DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Services; // IEventService üzerinden etkinlik iş mantığına erişmemizi sağlar
using Microsoft.AspNetCore.Authorization; // Authorize ve AllowAnonymous attributelarını kullanmamızı sağlar
using Microsoft.AspNetCore.Mvc; // ControllerBase route HTTP method ve response yapılarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Controllers; // bu dosyanın Controllers katmanına ait olduğunu belirtir


[ApiController] // bu sınıfın HTTP isteklerini karşılayan bir API controllerı olduğunu belirtir
[Route("api/[controller]")] // controllerın ana routeunu /api/Events olarak oluşturur
[Authorize] // controllerdaki endpointlere varsayılan olarak geçerli JWT ile giriş yapılmasını zorunlu tutar

public sealed class EventsController(IEventService eventService) : ControllerBase{
     // etkinlik iş kurallarını çalıştırmak için IEventService'i DI üzerinden alır




    [HttpGet] // GET /api/Events endpointini oluşturur
    public async Task< ActionResult<IReadOnlyList<EventResponse>>
       
    > GetAll(CancellationToken cancellationToken){
    
        var events = await eventService.GetAllAsync(cancellationToken);
            
         // tüm etkinlikleri service üzerinden getirir


        return Ok(events); // etkinlikleri 200 OK ile frontend'e döndürür
    }



    [HttpGet("popular")] // GET /api/Events/popular endpointini oluşturur
    [AllowAnonymous] // controllerda Authorize olsa bile bu endpointin JWT olmadan kullanılmasına izin verir(istisna)

    public async Task<ActionResult<IReadOnlyList<PopularEventResponse>>
    > GetPopular(
        [FromQuery] int limit = 10, //limit query parametresini alır, gönderilmezse 10 kullanır
        CancellationToken cancellationToken = default
    
        
        
    )
    {
        var events = await eventService.GetPopularAsync(
            limit,
            cancellationToken
        ); // istenen limit değerine göre popüler etkinlikleri service üzerinden getirir


        return Ok(events); // popüler etkinlikleri 200 OK ile döndürür
    }



    [HttpGet("{id:int}")] // GET /api/Events/5 gibi idye göre etkinlik getiren endpointi oluşturur
    public async Task<ActionResult<EventResponse>> GetById(
        int id, // routetan gelen etkinlik idsini alır
        CancellationToken cancellationToken
    )
    {
        var eventItem = await eventService.GetByIdAsync(
            id,
            cancellationToken
        ); // verilen idye sahip etkinliği service üzerinden getirir


        if (eventItem is null) // etkinlik bulunamazsa
        {
            return NotFound(
                new
                {
                    message = "Etkinlik bulunamadı."
                }
            ); // 404 Not Found döndürür
        }


        return Ok(eventItem); // etkinlik bulunduysa 200 OK ile döndürür
    }



    [HttpPost] // POST /api/Events endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] 
    // sadece ClubManager rolündeki kullanıcıların etkinlik oluşturmasına izin verir

    public async Task<ActionResult<EventResponse>> Create(
        [FromBody] CreateEventRequest request, // frontendden gönderilen JSON etkinlik bilgilerini request DTOsuna dönüştürür
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // giriş yapan ClubManagerın kullanıcı idsini JWT claimlerinden alır


        if (managerUserId is null) // tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(
                new
                {
                    message ="Token içerisinde kullanıcı kimliği bulunamadı."
                        
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
                nameof(GetById), // oluşturulan etkinliğin tekrar alınabileceği endpointi belirtir
                new { id = eventItem.Id }, // oluşturulan etkinliğin idsini route parametresi olarak verir
                eventItem // oluşturulan etkinlik bilgisini response bodyde döndürür
            );
            // başarılı oluşturma işleminde 201 Created döndürür
        }

        catch (ArgumentException exception)
        {
            return BadRequest(
                new { message = exception.Message }
            );
            // tarih kapasite başlık gibi geçersiz bilgilerde 400 Bad Request döndürür
        }

        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new { message = exception.Message }
            );
            // etkinliğin bağlanacağı kulüp bulunamazsa 404 Not Found döndürür
        }

        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
            // yönetici kendi yönetmediği kulübe etkinlik eklemeye çalışırsa 403 Forbidden döndürür
        }
    }



    [HttpPut("{id:int}")] // PUT /api/Events/5 endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] 
    // sadece ClubManager rolündeki kullanıcıların etkinlik güncellemesine izin verir

    public async Task<ActionResult<EventResponse>> Update(
        int id, // güncellenecek etkinliğin idsini routetan alır
        [FromBody] UpdateEventRequest request, // yeni etkinlik bilgilerini request bodyden alır
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // güncelleme işlemini yapan yöneticinin idsini JWTden alır


        if (managerUserId is null) // tokenda kullanıcı idsi yoksa
        {
            return Unauthorized(
                new
                {
                    message ="Token içerisinde kullanıcı kimliği bulunamadı."
                        
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
            // etkinlik idsini yönetici idsini ve yeni bilgileri service gönderir


            if (eventItem is null) // güncellenecek etkinlik bulunamazsa
            {
                return NotFound(
                    new { message = "Etkinlik bulunamadı." }
                ); // 404 Not Found döndürür
            }


            return Ok(eventItem); // güncellenen etkinliği 200 OK ile döndürür
        }

        catch (ArgumentException exception)
        {
            return BadRequest(
                new { message = exception.Message }
            );
            // geçersiz etkinlik bilgileri gönderilirse 400 Bad Request döndürür
        }

        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
            // kullanıcı başka yöneticinin etkinliğini güncellemeye çalışırsa 403 Forbidden döndürür
        }

        catch (InvalidOperationException exception)
        {
            return Conflict(
                new { message = exception.Message }
            );
            // iptal edilmiş etkinliği güncelleme gibi iş kuralı çakışmalarında 409 Conflict döndürür
        }
    }



    [HttpPut("{id:int}/cancel")] // PUT /api/Events/5/cancel endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] // sadece ClubManager rolündeki kullanıcıların etkinlik iptal etmesine izin verir

    public async Task<ActionResult<EventResponse>> Cancel(
        int id, // iptal edilecek etkinliğin idsini routetan alır
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // iptal işlemini yapan yöneticinin kullanıcı idsini JWTden alır


        if (managerUserId is null) // tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(
                new
                {
                    message = "Token içerisinde kullanıcı kimliği bulunamadı."
                       
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
            // etkinliği service üzerinden fiziksel olarak silmeden Cancelled durumuna geçirir


            if (eventItem is null) // etkinlik bulunamazsa
            {
                return NotFound(
                    new { message = "Etkinlik bulunamadı." }
                ); // 404 Not Found döndürür
            }


            return Ok(eventItem); // iptal edilen etkinliğin güncel halini 200 OK ile döndürür
        }

        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
            // kullanıcı başka yöneticinin etkinliğini iptal etmeye çalışırsa 403 Forbidden döndürür
        }

        catch (InvalidOperationException exception)
        {
            return Conflict(
                new { message = exception.Message }
            );
            // etkinlik zaten iptal edilmişse 409 Conflict döndürür
        }
    }



    private string? GetCurrentUserId() // giriş yapan kullanıcının idsini JWT claimlerinden alan yardımcı metottur
    {
        return User.FindFirstValue( ClaimTypes.NameIdentifier ?? User.FindFirstValue("sub")); 
                  
                // önce NameIdentifier claimindeki kullanıcı idsini arar
               // bulunamazsa standart JWT sub claiminden kullanıcı idsini almaya çalışır
    }
}