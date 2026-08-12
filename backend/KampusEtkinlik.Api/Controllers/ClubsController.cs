using System.Security.Claims; // JWT doğrulandıktan sonra kullanıcı id gibi claim bilgilerini okumamızı sağlar
using KampusEtkinlik.Api.Constants; // RoleNames.ClubManager gibi rol sabitlerine erişmemizi sağlar
using KampusEtkinlik.Api.DTOs.Clubs; // kulüp request ve response DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Services; // IClubService üzerinden kulüp iş mantığına erişmemizi sağlar
using Microsoft.AspNetCore.Authorization; // Authorize ile endpointlere giriş ve rol kontrolü eklememizi sağlar
using Microsoft.AspNetCore.Mvc; // ControllerBase route HTTP method ve response yapılarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Controllers; // bu dosyanın Controllers katmanına ait olduğunu belirtir


[ApiController] // bu sınıfın HTTP isteklerini karşılayan bir API controllerı olduğunu belirtir
[Route("api/[controller]")] // ana routeu /api/Clubs olarak oluşturur
[Authorize] // bu controllerdaki endpointlere erişmek için giriş yapmış ve geçerli JWTye sahip olmak gerekir

public sealed class ClubsController(
    IClubService clubService // kulüp iş kurallarını çalıştırmak için IClubService'i DI üzerinden alır
) : ControllerBase
{


    [HttpGet] // GET /api/Clubs endpointini oluşturur
    public async Task<
        ActionResult<IReadOnlyList<ClubResponse>>
    > GetAll(
        CancellationToken cancellationToken
    )
    {
        var clubs = await clubService.GetAllAsync(
            cancellationToken
        ); // bütün kulüpleri service üzerinden getirir


        return Ok(clubs); // kulüpleri 200 OK ile frontend'e döndürür
    }



    [HttpGet("{id:int}")] // GET /api/Clubs/5 gibi idye göre kulüp getiren endpointi oluşturur
    public async Task<ActionResult<ClubResponse>> GetById(
        int id, // routetan gelen kulüp idsini alır
        CancellationToken cancellationToken
    )
    {
        var club = await clubService.GetByIdAsync(
            id,
            cancellationToken
        ); // verilen idye sahip kulübü service üzerinden getirir


        if (club is null) // kulüp bulunamazsa
        {
            return NotFound(
                new
                {
                    message = "Kulüp bulunamadı."
                }
            ); // 404 Not Found döndürür
        }


        return Ok(club); // kulüp bulunduysa 200 OK ile döndürür
    }



    [HttpGet("{id:int}/stats")] // GET /api/Clubs/5/stats endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] // sadece ClubManager rolündeki kullanıcıların erişmesine izin verir

    public async Task<ActionResult> GetStats(
        int id, // istatistikleri istenen kulübün idsini alır
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // giriş yapan kullanıcının idsini JWT claimlerinden alır


        if (managerUserId is null) // tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(new
                {
                    message ="Token içerisinde kullanıcı kimliği yok."
                        
                }
            ); // 401 Unauthorized döndürür
        }


        try
        {
            var stats = await clubService.GetStatsAsync(
                id,
                managerUserId,
                cancellationToken
            );
            // kulüp idsini ve giriş yapan yöneticinin idsini service göndererek istatistikleri ister


            if (stats is null) // kulüp bulunamazsa
            {
                return NotFound( new
                    {
                        message = "Kulüp bulunamadı."
                    }
                ); // 404 Not Found döndürür
            }


            return Ok(stats); // istatistikleri 200 OK ile döndürür
        }

        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden, new
                {
                    message = exception.Message
                });
            // kullanıcı ClubManager olsa bile başka yöneticinin kulübüne erişmeye çalışırsa 403 Forbidden döndürür
        }
    }



    [HttpPost] // POST /api/Clubs endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] // sadece ClubManager rolündeki kullanıcıların kulüp oluşturmasına izin verir

    public async Task<ActionResult<ClubResponse>> Create(
        [FromBody] CreateClubRequest request, // frontendden gönderilen JSON kulüp bilgilerini request DTOsuna dönüştürür
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // kulübü oluşturacak giriş yapmış yöneticinin idsini JWTden alır


        if (managerUserId is null) // tokenda kullanıcı idsi yoksa
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
            var club = await clubService.CreateAsync(
                managerUserId,
                request, //frontendden gelen kulüp bilgileri
                cancellationToken
            );
            // giriş yapan yöneticinin idsi ve kulüp bilgileriyle yeni kulüp oluşturur, işi servise devrediyor


            return CreatedAtAction(
                nameof(GetById), // oluşturulan kulübün hangi endpointten tekrar alınabileceğini belirtir(önlem amaçlı böyle)
                new { id = club.Id }, // oluşturulan kulübün idsini route parametresi olarak verir
                club // oluşturulan kulüp bilgisini response bodyde döndürür(201 döndürmesi için ok değil)
            );
            // başarılı oluşturma işleminde 201 Created döndürür
        }

        catch (ArgumentException exception)
        {
            return BadRequest(
                new
                {
                    message = exception.Message
                }
            );
            // geçersiz kulüp adı gibi kullanıcı kaynaklı hatalarda 400 Bad Request döndürür
        }

        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                }
            );
            // aynı isimde kulüp bulunması gibi çakışmalarda 409 Conflict döndürür
        }
    }



    [HttpPut("{id:int}")] // PUT /api/Clubs/5 endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] // sadece ClubManager rolündeki kullanıcıların güncelleme yapmasına izin verir

    public async Task<ActionResult<ClubResponse>> Update(
        int id, // güncellenecek kulübün idsini routetan alır
        [FromBody] UpdateClubRequest request, // yeni kulüp bilgilerini request bodyden(frontendden) alır
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();
        // işlemi yapan kullanıcının idsini JWTden alır


        if (managerUserId is null) // tokenda kullanıcı idsi yoksa
        {
            return Unauthorized(new
                {
                    message = "Token içerisinde kullanıcı kimliği bulunamadı."
                }
            ); // 401 Unauthorized döndürür
        }


        try
        {
            var club = await clubService.UpdateAsync(
                id,
                managerUserId,
                request,
                cancellationToken
            );
            // kulüp idsini yönetici idsini ve yeni bilgileri service gönderir işlenmiş veriyi alır(güncellenmiş kulüp)


            if (club is null) // güncellenecek kulüp bulunamazsa
            {
                return NotFound(new
                    {
                        message = "Kulüp bulunamadı."
                    }
                ); // 404 Not Found döndürür
            }


            return Ok(club); // güncellenen kulübü 200 OK ile frontend'e döndürür
        }

        catch (ArgumentException exception)
        {
            return BadRequest(new{
                 
                    message = exception.Message
                
                });
            // geçersiz veri durumunda 400 Bad Request döndürür
        }

        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new{
                 
                    message = exception.Message
                
                });
            // kullanıcı başka yöneticinin kulübünü güncellemeye çalışırsa 403 Forbidden döndürür
        }

        catch (InvalidOperationException exception)
        {
            return Conflict(new
                {
                    message = exception.Message
                }
            );// aynı isimde başka kulüp bulunması gibi çakışmalarda 409 Conflict döndürür
        }
    }



    [HttpDelete("{id:int}")] // DELETE /api/Clubs/5 endpointini oluşturur
    [Authorize(Roles = RoleNames.ClubManager)] // sadece ClubManager rolündeki kullanıcıların silme yapmasına izin verir

    public async Task<IActionResult> Delete(
        int id, // silinecek kulübün idsini routetan alır
        CancellationToken cancellationToken
    ){
        var managerUserId = GetCurrentUserId();
        // işlemi yapan yöneticinin kullanıcı idsini JWTden alır


        if (managerUserId is null) // tokenda kullanıcı idsi bulunamazsa
        {
            return Unauthorized(new
                {
                    message ="Token içerisinde kullanıcı kimliği bulunamadı."
                }
            ); // 401 Unauthorized döndürür
        }


        try
        {
            var deleted = await clubService.DeleteAsync(
                id,
                managerUserId,
                cancellationToken
            );
            // kulübü service üzerinden silmeye çalışır


            if (!deleted) // kulüp bulunamadığı için silinemediyse
            {
                return NotFound(new {
                        message = "Kulüp bulunamadı."
                    }
                ); // 404 Not Found döndürür
            }


            return NoContent();
            // silme başarılıysa response body göndermeden 204 No Content döndürür
        }

        catch (UnauthorizedAccessException exception){
            return StatusCode(StatusCodes.Status403Forbidden, new{
            
                message = exception.Message
            
                });
            // kullanıcı başka yöneticinin kulübünü silmeye çalışırsa 403 Forbidden döndürür
        }

        catch (InvalidOperationException exception){
            return Conflict(new {
                 
                    message = exception.Message
                
            });
            //(serviste) etkinliği olan kulübün silinmesi gibi iş kuralı çakışmalarında 409 Conflict döndürür
        }
    }



    private string? GetCurrentUserId() // giriş yapan kullanıcının idsini JWT claimlerinden alan yardımcı metottur
    {
        return User.FindFirstValue(
                   ClaimTypes.NameIdentifier
               ) // önce NameIdentifier claimindeki kullanıcı idsini arar
               ?? User.FindFirstValue("sub"); // bulunamazsa JWTnin standart subject claiminden kullanıcı idsini almaya çalışır
               //ikiside olmazsa null döner
    }
}