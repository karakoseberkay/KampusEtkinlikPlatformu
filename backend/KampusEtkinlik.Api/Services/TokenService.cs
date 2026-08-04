using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KampusEtkinlik.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace KampusEtkinlik.Api.Services;

public sealed class TokenService(
    IConfiguration configuration) : ITokenService
{
    public TokenResult CreateToken(
        ApplicationUser user,
        IEnumerable<string> roles)
    {
        var jwtKey = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException(
                "Jwt:Key ayarı bulunamadı."
            );

        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException(
                "Jwt:Issuer ayarı bulunamadı."
            );

        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException(
                "Jwt:Audience ayarı bulunamadı."
            );

        var durationMinutes =
            configuration.GetValue<int?>("Jwt:DurationMinutes") ?? 60;

        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(durationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),

            new(ClaimTypes.NameIdentifier, user.Id),

            new(
                JwtRegisteredClaimNames.Email,
                user.Email ?? string.Empty
            ),

            new(ClaimTypes.Name, user.FullName),

            new(
                JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString()
            ),

            new(
                JwtRegisteredClaimNames.Iat,
                now.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64
            )
        };

        claims.AddRange(
            roles.Select(role =>
                new Claim(ClaimTypes.Role, role)
            )
        );

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var signingCredentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256
        );

        var jwtToken = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: signingCredentials
        );

        var accessToken =
            new JwtSecurityTokenHandler().WriteToken(jwtToken);

        return new TokenResult(
            accessToken,
            expiresAt
        );
    }
}