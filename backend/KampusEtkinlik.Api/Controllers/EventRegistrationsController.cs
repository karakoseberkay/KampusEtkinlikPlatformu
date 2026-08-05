using System.Security.Claims;
using KampusEtkinlik.Api.Constants;
using KampusEtkinlik.Api.DTOs.Registrations;
using KampusEtkinlik.Api.Enums;
using KampusEtkinlik.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KampusEtkinlik.Api.Controllers;

[ApiController]
[Route("api/events")]
[Authorize]
public sealed class EventRegistrationsController(
    IRegistrationService registrationService
) : ControllerBase
{
    [HttpPost("{eventId:int}/register")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<ActionResult<RegistrationResponse>> Register(
        int eventId,
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

        try
        {
            var registration =
                await registrationService.RegisterAsync(
                    userId,
                    eventId,
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

    [HttpGet("{eventId:int}/registrations")]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<
        ActionResult<IReadOnlyList<RegistrationResponse>>
    > GetForEvent(
        int eventId,
        [FromQuery]
        RegistrationApprovalStatus? approvalStatus,
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
            var registrations =
                await registrationService.GetForEventAsync(
                    eventId,
                    managerUserId,
                    approvalStatus,
                    cancellationToken
                );

            return Ok(registrations);
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
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(
                   ClaimTypes.NameIdentifier
               )
               ?? User.FindFirstValue("sub");
    }
}