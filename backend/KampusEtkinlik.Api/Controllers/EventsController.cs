using System.Security.Claims;
using KampusEtkinlik.Api.Constants;
using KampusEtkinlik.Api.DTOs.Events;
using KampusEtkinlik.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KampusEtkinlik.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class EventsController(
    IEventService eventService
) : ControllerBase
{
    [HttpGet]
    public async Task<
        ActionResult<IReadOnlyList<EventResponse>>
    > GetAll(
        CancellationToken cancellationToken
    )
    {
        var events = await eventService.GetAllAsync(
            cancellationToken
        );

        return Ok(events);
    }

    [HttpGet("popular")]
[AllowAnonymous]
public async Task<
    ActionResult<IReadOnlyList<PopularEventResponse>>
> GetPopular(
    [FromQuery] int limit = 10,
    CancellationToken cancellationToken = default
)
{
    var events = await eventService.GetPopularAsync(
        limit,
        cancellationToken
    );

    return Ok(events);
}

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EventResponse>> GetById(
        int id,
        CancellationToken cancellationToken
    )
    {
        var eventItem = await eventService.GetByIdAsync(
            id,
            cancellationToken
        );

        if (eventItem is null)
        {
            return NotFound(
                new
                {
                    message = "Etkinlik bulunamadı."
                }
            );
        }

        return Ok(eventItem);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<ActionResult<EventResponse>> Create(
        [FromBody] CreateEventRequest request,
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
            var eventItem = await eventService.CreateAsync(
                managerUserId,
                request,
                cancellationToken
            );

            return CreatedAtAction(
                nameof(GetById),
                new { id = eventItem.Id },
                eventItem
            );
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new { message = exception.Message }
            );
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new { message = exception.Message }
            );
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<ActionResult<EventResponse>> Update(
        int id,
        [FromBody] UpdateEventRequest request,
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
            var eventItem = await eventService.UpdateAsync(
                id,
                managerUserId,
                request,
                cancellationToken
            );

            if (eventItem is null)
            {
                return NotFound(
                    new { message = "Etkinlik bulunamadı." }
                );
            }

            return Ok(eventItem);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new { message = exception.Message }
            );
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new { message = exception.Message }
            );
        }
    }

    [HttpPut("{id:int}/cancel")]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<ActionResult<EventResponse>> Cancel(
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
            var eventItem = await eventService.CancelAsync(
                id,
                managerUserId,
                cancellationToken
            );

            if (eventItem is null)
            {
                return NotFound(
                    new { message = "Etkinlik bulunamadı." }
                );
            }

            return Ok(eventItem);
        }
        catch (UnauthorizedAccessException exception)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { message = exception.Message }
            );
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new { message = exception.Message }
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