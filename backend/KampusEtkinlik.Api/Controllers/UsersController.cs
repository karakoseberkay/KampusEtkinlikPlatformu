using System.Security.Claims;
using KampusEtkinlik.Api.Constants;
using KampusEtkinlik.Api.Dtos.Users;
using KampusEtkinlik.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KampusEtkinlik.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = RoleNames.ClubManager)]
public sealed class UsersController(
    UserManager<ApplicationUser> userManager)
    : ControllerBase
{
    private const string AdminEmail =
        "manager@kampus.com";


    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        if (!await IsAdminAsync())
        {
            return Forbid();
        }


        var users =
            await userManager.Users
                .OrderBy(user => user.FullName)
                .ToListAsync();


        var response =
            new List<UserResponse>();


        foreach (var user in users)
        {
            var roles =
                await userManager.GetRolesAsync(user);


            response.Add(
                new UserResponse(
                    user.Id,
                    user.FullName,
                    user.Email ?? string.Empty,
                    user.Department,
                    roles.ToArray()
                )
            );
        }


        return Ok(response);
    }



    [HttpPut("{userId}/role")]
    public async Task<ActionResult<UserResponse>> UpdateRole(
        string userId,
        UpdateUserRoleRequest request)
    {
        if (!await IsAdminAsync())
        {
            return Forbid();
        }


        var currentUserId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );


        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return Unauthorized();
        }


        if (currentUserId == userId)
        {
            return Conflict(new
            {
                message =
                    "Admin kendi rolünü değiştiremez."
            });
        }


        var targetUser =
            await userManager.FindByIdAsync(
                userId
            );


        if (targetUser is null)
        {
            return NotFound(new
            {
                message =
                    "Kullanıcı bulunamadı."
            });
        }


        var role =
            request.Role.Trim();


        if (
            role != RoleNames.Student
            &&
            role != RoleNames.ClubManager
        )
        {
            return BadRequest(new
            {
                message =
                    "Geçersiz rol."
            });
        }


        var currentRoles =
            await userManager.GetRolesAsync(
                targetUser
            );


        var projectRoles =
            currentRoles
                .Where(currentRole =>
                    currentRole
                        == RoleNames.Student
                    ||
                    currentRole
                        == RoleNames.ClubManager
                )
                .ToArray();


        if (projectRoles.Length > 0)
        {
            var removeResult =
                await userManager
                    .RemoveFromRolesAsync(
                        targetUser,
                        projectRoles
                    );


            if (!removeResult.Succeeded)
            {
                return BadRequest(new
                {
                    errors =
                        removeResult.Errors
                            .Select(
                                error => new
                                {
                                    error.Code,
                                    error.Description
                                }
                            )
                });
            }
        }


        var addResult =
            await userManager.AddToRoleAsync(
                targetUser,
                role
            );


        if (!addResult.Succeeded)
        {
            return BadRequest(new
            {
                errors =
                    addResult.Errors
                        .Select(
                            error => new
                            {
                                error.Code,
                                error.Description
                            }
                        )
            });
        }


        var roles =
            await userManager.GetRolesAsync(
                targetUser
            );


        return Ok(
            new UserResponse(
                targetUser.Id,
                targetUser.FullName,
                targetUser.Email
                    ?? string.Empty,
                targetUser.Department,
                roles.ToArray()
            )
        );
    }



    private async Task<bool> IsAdminAsync()
    {
        var currentUserId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );


        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            return false;
        }


        var currentUser =
            await userManager.FindByIdAsync(
                currentUserId
            );


        if (currentUser is null)
        {
            return false;
        }


        return string.Equals(
            currentUser.Email,
            AdminEmail,
            StringComparison.OrdinalIgnoreCase
        );
    }
}