using System.Security.Claims;
using KampusEtkinlik.Api.Constants;
using KampusEtkinlik.Api.DTOs.Clubs;
using KampusEtkinlik.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KampusEtkinlik.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class ClubsController(
    IClubService clubService
) : ControllerBase
{
    [HttpGet]
    public async Task<
        ActionResult<IReadOnlyList<ClubResponse>>
    > GetAll(
        CancellationToken cancellationToken
    )
    {
        var clubs = await clubService.GetAllAsync(
            cancellationToken
        );

        return Ok(clubs);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClubResponse>> GetById(
        int id,
        CancellationToken cancellationToken
    )
    {
        var club = await clubService.GetByIdAsync(
            id,
            cancellationToken
        );

        if (club is null)
        {
            return NotFound(
                new
                {
                    message = "Kulüp bulunamadı."
                }
            );
        }

        return Ok(club);
    }

    [HttpGet("{id:int}/stats")]
[Authorize(Roles = RoleNames.ClubManager)]
public async Task<ActionResult<ClubStatsResponse>> GetStats(
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
        var stats = await clubService.GetStatsAsync(
            id,
            managerUserId,
            cancellationToken
        );

        if (stats is null)
        {
            return NotFound(
                new
                {
                    message = "Kulüp bulunamadı."
                }
            );
        }

        return Ok(stats);
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

    [HttpPost]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<ActionResult<ClubResponse>> Create(
        [FromBody] CreateClubRequest request,
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
            var club = await clubService.CreateAsync(
                managerUserId,
                request,
                cancellationToken
            );

            return CreatedAtAction(
                nameof(GetById),
                new { id = club.Id },
                club
            );
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
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

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<ActionResult<ClubResponse>> Update(
        int id,
        [FromBody] UpdateClubRequest request,
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
            var club = await clubService.UpdateAsync(
                id,
                managerUserId,
                request,
                cancellationToken
            );

            if (club is null)
            {
                return NotFound(
                    new
                    {
                        message = "Kulüp bulunamadı."
                    }
                );
            }

            return Ok(club);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
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

    [HttpDelete("{id:int}")]
    [Authorize(Roles = RoleNames.ClubManager)]
    public async Task<IActionResult> Delete(
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
            var deleted = await clubService.DeleteAsync(
                id,
                managerUserId,
                cancellationToken
            );

            if (!deleted)
            {
                return NotFound(
                    new
                    {
                        message = "Kulüp bulunamadı."
                    }
                );
            }

            return NoContent();
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