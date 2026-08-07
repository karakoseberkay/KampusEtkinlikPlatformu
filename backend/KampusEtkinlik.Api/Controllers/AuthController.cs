using System.Security.Claims; // JWT doğrulandıktan sonra kullanıcı id gibi claim bilgilerini okumamızı sağlar
using KampusEtkinlik.Api.Constants; // RoleNames.Student gibi rol sabitlerine erişmemizi sağlar
using KampusEtkinlik.Api.Dtos; // RegisterRequest LoginRequest ve AuthResponse DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // ApplicationUser modeline erişmemizi sağlar
using KampusEtkinlik.Api.Services; // ITokenService servisine erişmemizi sağlar
using Microsoft.AspNetCore.Authorization; // Authorize ve AllowAnonymous attributelarını kullanmamızı sağlar
using Microsoft.AspNetCore.Identity; // UserManager ile kullanıcı parola ve rol işlemleri yapmamızı sağlar
using Microsoft.AspNetCore.Mvc; // ControllerBase ApiController Route HttpPost gibi controller yapılarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Controllers; // bu dosyanın Controllers katmanına ait olduğunu belirtir


[ApiController] // bu sınıfın HTTP isteklerini karşılayan bir API controllerı olduğunu belirtir
[Route("api/[controller]")] // controllerın ana routeunu belirler, burada /api/Auth olur

public sealed class AuthController(
    UserManager<ApplicationUser> userManager, // Identity üzerinden kullanıcı parola ve rol işlemlerini yapmamızı sağlar
    ITokenService tokenService) // başarılı giriş veya kayıt sonrası JWT üretmemizi sağlar
    : ControllerBase // API controllerlarının temel özelliklerini kullanmamızı sağlar
{


    [AllowAnonymous] // bu endpointi kullanmak için giriş yapmış olmak gerekmez
    [HttpPost("register")] // POST /api/Auth/register endpointini oluşturur

    public async Task<ActionResult> Register(
        RegisterRequest request) // frontendden gelen kayıt bilgilerini alır
    {
        var email = request.Email
            .Trim() // epostanın başındaki ve sonundaki boşlukları temizler
            .ToLowerInvariant(); // epostayı küçük harfe çevirerek standart hale getirir


        var existingUser =
            await userManager.FindByEmailAsync(email);
        // aynı epostayla kayıtlı kullanıcı var mı Identity üzerinden kontrol eder


        if (existingUser is not null) // kullanıcı zaten varsa tekrar kayıt oluşturmaz
        {
            return Conflict(new
            {
                message = "Bu e-posta adresi zaten kullanılıyor."
            }); // 409 Conflict döndürür
        }


        var user = new ApplicationUser // requestteki bilgilerden yeni kullanıcı nesnesi oluşturur
        {
            FullName = request.FullName.Trim(), // ad soyaddaki gereksiz boşlukları temizler
            Email = email, // standart hale getirilmiş epostayı kaydeder
            UserName = email, // Identity kullanıcı adı olarak epostayı kullanır

            Department = string.IsNullOrWhiteSpace(request.Department)
                ? null
                : request.Department.Trim(),
            // bölüm bilgisi boşsa null kaydeder, doluysa gereksiz boşlukları temizler

            CreatedAt = DateTimeOffset.UtcNow // kullanıcının oluşturulma zamanını UTC olarak kaydeder
        };


        var createResult = await userManager.CreateAsync(
            user,
            request.Password
        );
        // kullanıcıyı Identity üzerinden oluşturur, parola kurallarını kontrol eder ve BCrypt ile hashleyerek veritabanına kaydeder


        if (!createResult.Succeeded) // kullanıcı oluşturulamadıysa Identity hatalarını döndürür
        {
            return BadRequest(new
            {
                errors = createResult.Errors.Select(error => new
                {
                    error.Code, // hatanın kodu
                    error.Description // hatanın açıklaması
                })
            }); // 400 Bad Request döndürür
        }


        var roleResult = await userManager.AddToRoleAsync(
            user,
            RoleNames.Student
        );
        // yeni kayıt olan kullanıcıya varsayılan olarak Student rolünü verir


        if (!roleResult.Succeeded) // Student rolü atanamadıysa
        {
            await userManager.DeleteAsync(user);
            // kullanıcı oluşturulmuş ama rol atanamamışsa yarım kayıt kalmaması için kullanıcıyı geri siler


            return BadRequest(new
            {
                errors = roleResult.Errors.Select(error => new
                {
                    error.Code,
                    error.Description
                })
            }); // rol hatalarını 400 olarak döndürür
        }


        return Ok(await CreateAuthResponseAsync(user));
        // kayıt başarılıysa kullanıcı bilgileri + roller + JWT içeren AuthResponse döndürür
    }



    [AllowAnonymous] // giriş yapmak için önceden JWT gerekmez
    [HttpPost("login")] // POST /api/Auth/login endpointini oluşturur

    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request) // frontendden gelen eposta ve parola bilgilerini alır
    {
        var email = request.Email
            .Trim() // epostanın gereksiz boşluklarını temizler
            .ToLowerInvariant(); // epostayı standart olması için küçük harfe çevirir


        var user = await userManager.FindByEmailAsync(email);
        // epostaya sahip kullanıcıyı Identity üzerinden veritabanında arar


        if (user is null) // kullanıcı bulunamazsa
        {
            return Unauthorized(new
            {
                message = "E-posta veya şifre hatalı."
            }); // 401 Unauthorized döndürür
        }


        var isPasswordValid =
            await userManager.CheckPasswordAsync(
                user,
                request.Password
            );
        // girilen parolayı kullanıcının veritabanındaki BCrypt hash değeri ile doğrular


        if (!isPasswordValid) // parola yanlışsa
        {
            return Unauthorized(new
            {
                message = "E-posta veya şifre hatalı."
            }); // güvenlik için kullanıcı bulunamadığında verilen mesajla aynı mesajı döndürür
        }


        return Ok(await CreateAuthResponseAsync(user));
        // giriş başarılıysa kullanıcı bilgileri + roller + yeni JWT döndürür
    }



    [Authorize] // bu endpointi kullanmak için geçerli JWT gerekir
    [HttpGet("me")] // GET /api/Auth/me endpointini oluşturur

    public async Task<ActionResult<AuthResponse>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );
        // doğrulanmış JWT içindeki NameIdentifier claiminden kullanıcı idsini alır


        if (string.IsNullOrWhiteSpace(userId)) // tokendan kullanıcı idsi alınamazsa
        {
            return Unauthorized(); // 401 döndürür
        }


        var user = await userManager.FindByIdAsync(userId);
        // tokendan aldığımız id ile gerçek kullanıcıyı veritabanından bulur


        if (user is null) // token geçerli olsa bile kullanıcı artık veritabanında yoksa
        {
            return Unauthorized(); // 401 döndürür
        }


        return Ok(await CreateAuthResponseAsync(user));
        // mevcut kullanıcının bilgilerini rollerini ve yeni tokenı AuthResponse olarak döndürür
    }



    private async Task<AuthResponse> CreateAuthResponseAsync(
        ApplicationUser user) // kullanıcı için ortak auth cevabını oluşturan yardımcı metottur
    {
        var roles = await userManager.GetRolesAsync(user);
        // kullanıcının Student veya ClubManager gibi rollerini Identityden alır


        var tokenResult = tokenService.CreateToken(
            user,
            roles
        );
        // kullanıcı ve rollerini TokenServicee göndererek yeni JWT oluşturur


        return new AuthResponse(
            user.Id, // kullanıcı idsi
            user.FullName, // kullanıcı adı soyadı
            user.Email ?? string.Empty, // kullanıcı epostası
            roles.ToArray(), // kullanıcının rollerini array olarak döndürür
            tokenResult.AccessToken, // oluşturulan JWT access token
            tokenResult.ExpiresAtUtc // tokenın biteceği UTC zamanı
        );
    }
}