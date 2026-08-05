namespace KampusEtkinlik.Api.DTOs.Clubs;

public sealed class ClubResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? LogoUrl { get; set; }

    public string ManagerUserId { get; set; } = string.Empty;

    public string ManagerFullName { get; set; } = string.Empty;

    public int EventCount { get; set; }
}