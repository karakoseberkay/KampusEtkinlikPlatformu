using System.Security.Claims;
using KampusEtkinlik.Api.Constants;
using KampusEtkinlik.Api.DTOs.Registrations;
using KampusEtkinlik.Api.Enums;
using KampusEtkinlik.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KampusEtkinlik.Api.Controllers;

[ApiController] // bu sınıfın HTTP isteklerini karşılayan bir API controllerı olduğunu belirtir
[Route("api/events")] // controllerın ana routeunu /api/events olarak belirler
[Authorize] // controllerdaki endpointlere varsayılan olarak geçerli JWT ile giriş yapılmasını zorunlu tutar

public sealed class EventRegistrationsController(
    IRegistrationService registrationService // etkinlik kayıt iş kurallarını çalıştırmak için servisi DI üzerinden alır
) : ControllerBase
{
    [HttpPost("{eventId:int}/register")] // POST /api/events/5/register endpointini oluşturur
    [Authorize(Roles = RoleNames.Student)] // sadece Student rolündeki kullanıcıların etkinliğe kayıt olmasına izin verir

    public async Task<ActionResult> Register(
        int eventId, // kayıt olunacak etkinliğin idsini routetan alır
        CancellationToken cancellationToken
    )
    {
        var userId = GetCurrentUserId();
        // kayıt olmak isteyen öğrencinin idsini JWT claimlerinden alır


        if (userId is null)
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
            var registration = await registrationService.RegisterAsync(
                    userId,
                    eventId,
                    cancellationToken
                );
            // öğrencinin idsini ve etkinlik idsini service göndererek kayıt işlemini gerçekleştirir


            return Ok(registration);
            // oluşturulan kayıt bilgisini 200 OK ile frontend'e döndürür
        }

        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                }
            );
            // etkinlik bulunamazsa 404 Not Found döndürür
        }

        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                }
            );
            // tekrar kayıt kontenjan iptal edilmiş veya geçmiş etkinlik gibi durumlarda 409 Conflict döndürür
        }
    }


    [HttpGet("{eventId:int}/registrations")] // GET /api/events/5/registrations endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] 
    // sadece ClubManager rolündeki kullanıcıların etkinlik kayıtlarını görmesine izin verir

    public async Task<ActionResult<IReadOnlyList<RegistrationResponse>>
    > GetForEvent(
        int eventId, // kayıtları görüntülenecek etkinliğin idsini routetan alır

        [FromQuery]RegistrationApprovalStatus? approvalStatus,
         // query stringden isteğe bağlı Pending Approved veya Rejected filtresi alır

        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // işlemi yapan ClubManagerın kullanıcı idsini JWT claimlerinden alır


        if (managerUserId is null)
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
            var registrations = await registrationService.GetForEventAsync(
                    eventId,
                    managerUserId,
                    approvalStatus,
                    cancellationToken
                );
            // etkinlik idsini manager idsini ve varsa durum filtresini service göndererek kayıtları getirir


            return Ok(registrations);
            // etkinliğin kayıtlarını 200 OK ile frontend'e döndürür
        }

        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                }
            );
            // etkinlik bulunamazsa 404 Not Found döndürür
        }

        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                }
            );
            // manager başka kulübün etkinlik kayıtlarını görmeye çalışırsa 403 Forbidden döndürür
        }
    }


    private string? GetCurrentUserId() // giriş yapan kullanıcının idsini JWT claimlerinden alan yardımcı metottur
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"); 
                // önce NameIdentifier claimindeki kullanıcı idsini arar
              // bulunamazsa standart JWT sub claiminden kullanıcı idsini almaya çalışır
    }
}