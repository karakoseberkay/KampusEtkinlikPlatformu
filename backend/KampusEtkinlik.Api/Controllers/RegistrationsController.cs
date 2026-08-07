 
using System.Security.Claims; // JWT doğrulandıktan sonra kullanıcı id gibi claim bilgilerini okumamızı sağlar
using KampusEtkinlik.Api.Constants; // RoleNames.Student ve RoleNames.ClubManager sabitlerine erişmemizi sağlar
using KampusEtkinlik.Api.DTOs.Registrations; // RegistrationResponse DTOsuna erişmemizi sağlar
using KampusEtkinlik.Api.Services; // IRegistrationService üzerinden kayıt iş mantığına erişmemizi sağlar
using Microsoft.AspNetCore.Authorization; // Authorize ile giriş ve rol kontrolü yapmamızı sağlar
using Microsoft.AspNetCore.Mvc; // ControllerBase route HTTP method ve response yapılarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Controllers; // bu dosyanın Controllers katmanına ait olduğunu belirtir


[ApiController] // bu sınıfın HTTP isteklerini karşılayan bir API controllerı olduğunu belirtir
[Route("api/[controller]")] // controllerın ana routeunu /api/Registrations olarak oluşturur
[Authorize] // controllerdaki endpointlere varsayılan olarak geçerli JWT ile giriş yapılmasını zorunlu tutar

public sealed class RegistrationsController(
    IRegistrationService registrationService // kayıt iş kurallarını çalıştırmak için servisi DI üzerinden alır
) : ControllerBase
{


    [HttpGet("me")] // GET /api/Registrations/me endpointini oluşturur
    [Authorize(Roles = RoleNames.Student)] // sadece Student rolündeki kullanıcının kendi kayıtlarını görmesine izin verir

    public async Task<
        ActionResult<IReadOnlyList<RegistrationResponse>>
    > GetMine(
        CancellationToken cancellationToken
    )
    {
        var userId = GetCurrentUserId();
        // giriş yapan öğrencinin kullanıcı idsini JWT claimlerinden alır


        if (userId is null) // tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(
                new
                {
                    message =
                        "Token içerisinde kullanıcı kimliği bulunamadı."
                }
            ); // 401 Unauthorized döndürür
        }


        var registrations =
            await registrationService.GetMineAsync(
                userId,
                cancellationToken
            );
        // JWTden alınan kullanıcı idsine ait bütün etkinlik kayıtlarını service üzerinden getirir


        return Ok(registrations);
        // öğrencinin kayıtlarını 200 OK ile frontend'e döndürür
    }



    [HttpPut("{id:int}/approve")] // PUT /api/Registrations/5/approve endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] // sadece ClubManager rolündeki kullanıcıların kayıt onaylamasına izin verir

    public async Task<ActionResult<RegistrationResponse>> Approve(
        int id, // onaylanacak registration kaydının idsini routetan alır
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // onay işlemini yapan ClubManagerın kullanıcı idsini JWTden alır


        if (managerUserId is null) // tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(
                new
                {
                    message =
                        "Token içerisinde kullanıcı kimliği bulunamadı."
                }
            ); // 401 Unauthorized döndürür
        }


        try
        {
            var registration =
                await registrationService.ApproveAsync(
                    id,
                    managerUserId,
                    cancellationToken
                );
            // kayıt idsini ve manager idsini service göndererek kayıt talebini onaylar


            return Ok(registration);
            // Approved durumuna geçen kayıt bilgisini 200 OK ile frontend'e döndürür
        }

        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                }
            );
            // belirtilen registration kaydı bulunamazsa 404 Not Found döndürür
        }

        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                }
            );
            // manager başka kulübün kayıt talebini onaylamaya çalışırsa 403 Forbidden döndürür
        }

        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                }
            );
            // kayıt Pending değilse kontenjan doluysa veya etkinlik iptalse 409 Conflict döndürür
        }
    }



    [HttpPut("{id:int}/reject")] // PUT /api/Registrations/5/reject endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] // sadece ClubManager rolündeki kullanıcıların kayıt reddetmesine izin verir

    public async Task<ActionResult<RegistrationResponse>> Reject(
        int id, // reddedilecek registration kaydının idsini routetan alır
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // red işlemini yapan ClubManagerın kullanıcı idsini JWTden alır


        if (managerUserId is null) // tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(
                new
                {
                    message =
                        "Token içerisinde kullanıcı kimliği bulunamadı."
                }
            ); // 401 Unauthorized döndürür
        }


        try
        {
            var registration =
                await registrationService.RejectAsync(
                    id,
                    managerUserId,
                    cancellationToken
                );
            // kayıt idsini ve manager idsini service göndererek kayıt talebini reddeder


            return Ok(registration);
            // Rejected durumuna geçen kayıt bilgisini 200 OK ile frontend'e döndürür
        }

        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                }
            );
            // belirtilen registration kaydı bulunamazsa 404 Not Found döndürür
        }

        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                }
            );
            // manager başka kulübün kayıt talebini reddetmeye çalışırsa 403 Forbidden döndürür
        }

        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                }
            );
            // kayıt Pending durumda değilse 409 Conflict döndürür
        }
    }



    private string? GetCurrentUserId() // giriş yapan kullanıcının idsini JWT claimlerinden alan yardımcı metottur
    {
        return User.FindFirstValue(
                   ClaimTypes.NameIdentifier
               ) // önce NameIdentifier claimindeki kullanıcı idsini arar
               ?? User.FindFirstValue("sub"); // bulunamazsa JWTnin standart sub claimindeki kullanıcı idsini almaya çalışır
    }
}
 
