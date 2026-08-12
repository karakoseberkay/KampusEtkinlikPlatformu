using System.IdentityModel.Tokens.Jwt; // JWT oluşturmak ve JWT içindeki standart claim isimlerine erişmek için kullanılır
using System.Security.Claims; // kullanıcı id adı rolü gibi claim bilgilerini oluşturmak için kullanılır
using System.Text; // jwtKey metnini byte dizisine çevirmek için kullanılır
using KampusEtkinlik.Api.Models; // ApplicationUser modeline erişmemizi sağlar
using Microsoft.IdentityModel.Tokens; // JWT imzalama anahtarı ve signing ayarlarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir


public sealed class TokenService(IConfiguration configuration) : ITokenService 
// JWT üretme işini yapan gerçek servistir, ayarları configurationdan alır
{
    public TokenResult CreateToken(ApplicationUser user, IEnumerable<string> roles) 
    // token oluşturulacak kullanıcıyı alır
    // kullanıcının rollerini alır
    {
        var jwtKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key bulunamadı.");
        // JWTyi imzalamak için kullanılan gizli anahtarı alır 


        var issuer = configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer bulunamadı.");
        // tokenı üreten sistem bilgisini alır


        var audience = configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience bulunamadı.");
        // tokenın hangi uygulama için üretileceği bilgisini alır

        var durationMinutes =configuration.GetValue<int?>("Jwt:DurationMinutes") ?? 60;
        // tokenın kaç dakika geçerli olacağını alır, ayar varsa onu alır yoksa null dönüp 60 dakika kullanır


        var now = DateTimeOffset.UtcNow; // tokenın oluşturulduğu anı UTC olarak alır

        var expiresAt = now.AddMinutes(durationMinutes); // tokenın biteceği zamanı hesaplar


        var claims = new List<Claim> 
        //tokenın içinde taşınacak kullanıcı bilgilerini oluşturur
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            // JWTnin standart subject alanına kullanıcı idsini ekler

            new(ClaimTypes.NameIdentifier, user.Id),
            // backendde kullanıcı idsini kolayca okuyabilmek için id claimi ekler

            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                 // kullanıcının epostasını tokena ekler

            new(ClaimTypes.Name, user.FullName), 
            // kullanıcının adını tokena ekler

            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), 
            // her tokena benzersiz bir kimlik verir

            new(
                JwtRegisteredClaimNames.Iat,
                now.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64
            ) 
            // tokenın oluşturulduğu zamanı tokena ekler
        };


        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
         // kullanıcının rollerini tek tek Role claimi olarak tokena ekler (student ve clubmanager)


        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
         // jwtKeyi byte dizisine çevirip tokenı imzalamada kullanılacak güvenlik anahtarını oluşturur
         //configurationdan alıyor jwtkeyi

        var signingCredentials = new SigningCredentials(
            securityKey, SecurityAlgorithms.HmacSha256); 
            // tokenın hangi anahtar ve algoritmayla imzalanacağını belirler


        var jwtToken = new JwtSecurityToken(
            issuer: issuer, // tokenı üreten sistem
            audience: audience, // tokenın kullanılacağı hedef uygulama
            claims: claims, // tokenın içinde taşınacak kullanıcı bilgileri
            notBefore: now.UtcDateTime, // tokenın hangi andan itibaren geçerli olduğunu belirler
            expires: expiresAt.UtcDateTime, // tokenın hangi anda geçersiz olacağını belirler
            signingCredentials: signingCredentials // tokenın imza ayarlarını verir
        );


        var accessToken =new JwtSecurityTokenHandler().WriteToken(jwtToken);
        // oluşturulan JWT nesnesini Angulara gönderilecek string token haline çevirir


        return new TokenResult(accessToken, expiresAt); 
        // oluşturulan JWTyi döndürür
        // tokenın bitiş tarihini döndürür
        
    }
}