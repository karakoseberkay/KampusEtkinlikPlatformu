namespace KampusEtkinlik.Api.Dtos;

public sealed record AuthResponse(
    string UserId,
    string FullName,
    string Email,
    IReadOnlyCollection<string> Roles,
    string AccessToken,
    DateTimeOffset ExpiresAtUtc
);