using System.Security.Claims; // giriş yapan kullanıcının claim bilgilerine ve user idsine ulaşmamızı sağlar
using KampusEtkinlik.Api.DTOs.CheckIn; // check-in request ve response DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Services; // qr işlemlerini yapan IEventCheckInService servisine erişmemizi sağlar
using Microsoft.AspNetCore.Authorization; // Authorize ile rol bazlı yetkilendirme yapmamızı sağlar
using Microsoft.AspNetCore.Mvc; // ControllerBase Route HttpPost ve HTTP cevaplarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Controllers; // bu dosyanın Controllers katmanına ait olduğunu belirtir

[ApiController] // bu classın HTTP isteklerini karşılayan bir API controllerı olduğunu belirtir
[Route("api")] // bu controllerdaki bütün endpointlerin adresini api ile başlatır
public sealed class CheckInController(IEventCheckInService eventCheckInService) : ControllerBase
// qr oluşturma ve qr okutma isteklerini karşılayıp service katmanına gönderir
{
    [Authorize(Roles = "ClubManager")] // bu endpointi sadece ClubManager rolündeki kullanıcıların kullanmasına izin verir
    [HttpPost("events/{eventId:int}/check-in-session")] // POST api/events/{eventId}/check-in-session adresini oluşturur ve eventIdnin int olmasını zorunlu yapar
    public async Task<ActionResult<CheckInSessionResponse>> CreateSession(int eventId, [FromBody] CreateCheckInSessionRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        // giriş yapan kullanıcının tokenındaki benzersiz user idsini alır

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(); // user id bulunamazsa 401 Unauthorized döndürür
        }

        try
        {
            var result = await eventCheckInService.CreateSessionAsync(eventId, userId, request.ExpiresInMinutes, cancellationToken);
            // event id manager id ve qr süresini service katmanına göndererek qr oturumu oluşturur

            return Ok(result); // işlem başarılıysa sonucu 200 OK ile frontende döndürür
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
            // service etkinliği bulamazsa hata mesajını 404 Not Found olarak döndürür
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = exception.Message });
            // manager kendisine ait olmayan etkinlik için işlem yaparsa 403 Forbidden döndürür
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
            // iptal edilmiş etkinlik veya geçersiz qr süresi gibi durumlarda 400 Bad Request döndürür
        }
    }

    [Authorize(Roles = "Student,ClubManager")] // Student veya ClubManager rolündeki kullanıcıların check-in yapmasına izin verir
    [HttpPost("check-in")] // POST api/check-in endpointini oluşturur
    public async Task<ActionResult<CheckInResponse>> CheckIn([FromBody] CheckInRequest request, CancellationToken cancellationToken)
    {//frombody json olarak gelen veriyi request dtosuna dönüştürüyor ve cancellationtoken ile işlemi iptal etme imkanı sağlar
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        // qr okutan giriş yapmış kullanıcının user idsini token içinden alır

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(); // user id bulunamazsa 401 Unauthorized döndürür
        }

        var isClubManager = User.IsInRole("ClubManager");
        // qr okutan kullanıcının clubmanager olup olmadığını servise gönderir

        try
        {
            var result = await eventCheckInService.CheckInAsync(userId, request.Token, isClubManager, cancellationToken);
            // kullanıcı id token ve rol bilgisini service katmanına göndererek check-in işlemini başlatır

            return Ok(result); // check-in başarılıysa sonucu 200 OK ile frontende döndürür
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
            // qr tokenına ait oturum bulunamazsa 404 Not Found döndürür
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
            // qr süresi dolmuş aktif değil veya kullanıcı daha önce giriş yapmışsa 400 Bad Request döndürür
        }
    }
}