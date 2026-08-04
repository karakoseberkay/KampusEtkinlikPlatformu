using KampusEtkinlik.Api.Models;

namespace KampusEtkinlik.Api.Services;

public sealed record TokenResult(
    string AccessToken,
    DateTimeOffset ExpiresAtUtc
);

public interface ITokenService
{
    TokenResult CreateToken(
        ApplicationUser user,
        IEnumerable<string> roles
    );
}