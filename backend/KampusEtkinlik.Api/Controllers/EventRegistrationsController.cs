using System.Security.Claims; // jwt içindeki kullanıcı id gibi claim bilgilerine erişmek için
using KampusEtkinlik.Api.Constants; // projede tanımlanan rol sabitlerini kullanmak için
using KampusEtkinlik.Api.DTOs.Registrations; // kayıt işlemlerinde kullanılan response dtolarına erişmek için
using KampusEtkinlik.Api.Enums; // kayıt durumlarını belirten enum değerlerini kullanmak için
using KampusEtkinlik.Api.Services; // kayıt işlemlerinin iş kurallarını yöneten servise erişmek için
using Microsoft.AspNetCore.Authorization; // authorize ile endpoint yetkilendirmesi yapmak için
using Microsoft.AspNetCore.Mvc; // controller http method ve response yapılarını kullanmak için

namespace KampusEtkinlik.Api.Controllers; // bu dosyanın controllers katmanına ait olduğunu belirtir

[ApiController] // bu sınıfın http isteklerini karşılayan bir api controllerı olduğunu belirtir
[Route("api/events")] // controllerın ana routeunu /api/events olarak belirler
[Authorize] // controllerdaki endpointlere varsayılan olarak geçerli jwt ile giriş yapılmasını zorunlu tutar
public sealed class EventRegistrationsController(IRegistrationService registrationService) : ControllerBase{
     // etkinlik kayıt iş kurallarını çalıştırmak için servisi di üzerinden alır


    [HttpPost("{eventId:int}/register")] // POST /api/events/5/register endpointini oluşturur
    [Authorize(Roles = "Student,ClubManager")] // student ve clubmanager rolündeki kullanıcıların etkinliğe kayıt olmasına izin verir
    public async Task<ActionResult> Register(
        int eventId, // kayıt olunacak etkinliğin idsini routetan alır
        CancellationToken cancellationToken // istek iptal edilirse devam eden async işlemlerin durdurulabilmesini sağlar
    )
    {
        var userId = GetCurrentUserId();
        // kayıt olmak isteyen kullanıcının idsini jwt claimlerinden alır

        if (userId is null) // tokendan kullanıcı idsi alınamadıysa
        {
            return Unauthorized(new{
                
                
                    message = "User identity could not be found in the token."
                });
             // 401 unauthorized döndürür
        }

        try
        {
            var registration = await registrationService.RegisterAsync(
                userId,
                eventId,
                cancellationToken
            );
            // kullanıcı idsini ve etkinlik idsini service göndererek kayıt işlemini gerçekleştirir

            return Ok(registration);
            // oluşturulan kayıt bilgisini 200 ok ile frontende döndürür
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new{
                    message = exception.Message
    });
            // etkinlik bulunamazsa 404 not found döndürür
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new{
                    message = exception.Message
                });
            // tekrar kayıt kontenjan iptal edilmiş veya geçmiş etkinlik gibi durumlarda 409 conflict döndürür
        }
    }

    [HttpGet("{eventId:int}/registrations")] // GET /api/events/5/registrations endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)]
    // sadece clubmanager rolündeki kullanıcıların etkinlik kayıtlarını görmesine izin verir
    public async Task<ActionResult<IReadOnlyList<RegistrationResponse>>> GetForEvent(
        int eventId, // kayıtları görüntülenecek etkinliğin idsini routetan alır
        [FromQuery] RegistrationApprovalStatus? approvalStatus,
        // query stringden isteğe bağlı pending approved veya rejected filtresi alır
        CancellationToken cancellationToken // istek iptal edilirse devam eden async işlemlerin durdurulabilmesini sağlar
    )
    {
        var managerUserId = GetCurrentUserId();
        // işlemi yapan clubmanagerın kullanıcı idsini jwt claimlerinden alır

        if (managerUserId is null) // tokendan manager idsi alınamadıysa
        {
            return Unauthorized(new{
                    message = "User identity could not be found in the token."
                });
                 // 401 unauthorized döndürür
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
            // etkinliğin kayıtlarını 200 ok ile frontende döndürür
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new{
                    message = exception.Message
                }
            );
            // etkinlik bulunamazsa 404 not found döndürür
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new{
                    message = exception.Message
                }
            );
            // manager başka kulübün etkinlik kayıtlarını görmeye çalışırsa 403 forbidden döndürür
        }
    }

    private string? GetCurrentUserId() // giriş yapan kullanıcının idsini jwt claimlerinden alan yardımcı metottur
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        // önce nameidentifier claimindeki kullanıcı idsini arar
        // bulunamazsa ?? operatörü sayesinde sub claimindeki kullanıcı idsini kullanır
    }
}