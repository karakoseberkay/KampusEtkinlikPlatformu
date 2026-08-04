using KampusEtkinlik.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace KampusEtkinlik.Api.Security;

public sealed class BcryptPasswordHasher
    : IPasswordHasher<ApplicationUser>
{
    public string HashPassword(
        ApplicationUser user,
        string password)
    {
        ArgumentNullException.ThrowIfNull(user);
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public PasswordVerificationResult VerifyHashedPassword(
        ApplicationUser user,
        string hashedPassword,
        string providedPassword)
    {
        ArgumentNullException.ThrowIfNull(user);

        if (string.IsNullOrWhiteSpace(hashedPassword) ||
            string.IsNullOrWhiteSpace(providedPassword))
        {
            return PasswordVerificationResult.Failed;
        }

        var isValid = BCrypt.Net.BCrypt.Verify(
            providedPassword,
            hashedPassword
        );

        return isValid
            ? PasswordVerificationResult.Success
            : PasswordVerificationResult.Failed;
    }
}