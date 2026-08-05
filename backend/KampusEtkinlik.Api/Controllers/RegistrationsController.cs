using System.Security.Claims;
using KampusEtkinlik.Api.Constants;
using KampusEtkinlik.Api.DTOs.Registrations;
using KampusEtkinlik.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KampusEtkinlik.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class RegistrationsController(
    IRegistrationService registrationService
) : ControllerBase
{
    [HttpGet("me")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<
        ActionResult<IReadOnlyList<RegistrationResponse>>
    > GetMine(
        CancellationToken cancellationToken
    )
    {
        var userId = GetCurrentUserId();

        if (userId is null)
        {
            return Unauthorized(
                new
                {
                    message =
                        "Token içerisinde kullanıcı kimliği bulunamadı."
                }
            );
        }

        var registrations =
            await registrationService.GetMineAsync(
                userId,
                cancellationToken
            );

        return Ok(registrations);
    }

    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<ActionResult<RegistrationResponse>> Approve(
        int id,
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();

        if (managerUserId is null)
        {
            return Unauthorized(
                new
                {
                    message =
                        "Token içerisinde kullanıcı kimliği bulunamadı."
                }
            );
        }

        try
        {
            var registration =
                await registrationService.ApproveAsync(
                    id,
                    managerUserId,
                    cancellationToken
                );

            return Ok(registration);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                }
            );
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                }
            );
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                }
            );
        }
    }

    [HttpPut("{id:int}/reject")]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<ActionResult<RegistrationResponse>> Reject(
        int id,
        CancellationToken cancellationToken
    )
    {
        var managerUserId = GetCurrentUserId();

        if (managerUserId is null)
        {
            return Unauthorized(
                new
                {
                    message =
                        "Token içerisinde kullanıcı kimliği bulunamadı."
                }
            );
        }

        try
        {
            var registration =
                await registrationService.RejectAsync(
                    id,
                    managerUserId,
                    cancellationToken
                );

            return Ok(registration);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                }
            );
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = exception.Message
                }
            );
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                }
            );
        }
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(
                   ClaimTypes.NameIdentifier
               )
               ?? User.FindFirstValue("sub");
    }
}