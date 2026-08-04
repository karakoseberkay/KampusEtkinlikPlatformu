using System.Security.Claims;
using KampusEtkinlik.Api.Constants;
using KampusEtkinlik.Api.Dtos;
using KampusEtkinlik.Api.Models;
using KampusEtkinlik.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KampusEtkinlik.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(
        RegisterRequest request)
    {
        var email = request.Email
            .Trim()
            .ToLowerInvariant();

        var existingUser =
            await userManager.FindByEmailAsync(email);

        if (existingUser is not null)
        {
            return Conflict(new
            {
                message = "Bu e-posta adresi zaten kullanılıyor."
            });
        }

        var user = new ApplicationUser
        {
            FullName = request.FullName.Trim(),
            Email = email,
            UserName = email,
            Department = string.IsNullOrWhiteSpace(request.Department)
                ? null
                : request.Department.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        var createResult = await userManager.CreateAsync(
            user,
            request.Password
        );

        if (!createResult.Succeeded)
        {
            return BadRequest(new
            {
                errors = createResult.Errors.Select(error => new
                {
                    error.Code,
                    error.Description
                })
            });
        }

        var roleResult = await userManager.AddToRoleAsync(
            user,
            RoleNames.Student
        );

        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);

            return BadRequest(new
            {
                errors = roleResult.Errors.Select(error => new
                {
                    error.Code,
                    error.Description
                })
            });
        }

        return Ok(await CreateAuthResponseAsync(user));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request)
    {
        var email = request.Email
            .Trim()
            .ToLowerInvariant();

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "E-posta veya şifre hatalı."
            });
        }

        var isPasswordValid =
            await userManager.CheckPasswordAsync(
                user,
                request.Password
            );

        if (!isPasswordValid)
        {
            return Unauthorized(new
            {
                message = "E-posta veya şifre hatalı."
            });
        }

        return Ok(await CreateAuthResponseAsync(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponse>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(await CreateAuthResponseAsync(user));
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(
        ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);

        var tokenResult = tokenService.CreateToken(
            user,
            roles
        );

        return new AuthResponse(
            user.Id,
            user.FullName,
            user.Email ?? string.Empty,
            roles.ToArray(),
            tokenResult.AccessToken,
            tokenResult.ExpiresAtUtc
        );
    }
}