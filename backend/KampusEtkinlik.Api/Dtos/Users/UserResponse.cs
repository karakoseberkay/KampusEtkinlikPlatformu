namespace KampusEtkinlik.Api.Dtos.Users;

public sealed record UserResponse(
    string Id,
    string FullName,
    string Email,
    string? Department,
    string[] Roles
);