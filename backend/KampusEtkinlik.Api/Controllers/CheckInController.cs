using System.Security.Claims;
using KampusEtkinlik.Api.DTOs.CheckIn;
using KampusEtkinlik.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KampusEtkinlik.Api.Controllers;


[ApiController]
[Route("api")]
public sealed class CheckInController(
    IEventCheckInService eventCheckInService
) : ControllerBase
{
    [Authorize(Roles = "ClubManager")]
    [HttpPost("events/{eventId:int}/check-in-session")]
    public async Task<ActionResult<CheckInSessionResponse>> CreateSession(
        int eventId,
        [FromBody] CreateCheckInSessionRequest request,
        CancellationToken cancellationToken
    )
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);


        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }


        try
        {
            var result = await eventCheckInService.CreateSessionAsync(
                eventId,
                userId,
                request.ExpiresInMinutes,
                cancellationToken
            );


            return Ok(result);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new
            {
                message = exception.Message
            });
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
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }



    [Authorize(Roles = "Student,ClubManager")]
    [HttpPost("check-in")]
    public async Task<ActionResult<CheckInResponse>> CheckIn(
        [FromBody] CheckInRequest request,
        CancellationToken cancellationToken
    )
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);


        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }


        var isClubManager = User.IsInRole("ClubManager");
        // qr okutan kullanıcının clubmanager olup olmadığını servise gönderir


        try
        {
            var result = await eventCheckInService.CheckInAsync(
                userId,
                request.Token,
                isClubManager,
                cancellationToken
            );


            return Ok(result);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new
            {
                message = exception.Message
            });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }
}