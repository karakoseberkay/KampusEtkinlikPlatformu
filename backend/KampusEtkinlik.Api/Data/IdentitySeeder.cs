using KampusEtkinlik.Api.Constants;
using KampusEtkinlik.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace KampusEtkinlik.Api.Data;

public static class IdentitySeeder
{
    public static async Task SeedRolesAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var roleManager =
            scope.ServiceProvider
                .GetRequiredService<RoleManager<IdentityRole>>();

        var userManager =
            scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();

        // Sistemde bulunması gereken rolleri oluşturur.
        foreach (var roleName in RoleNames.All)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var roleResult = await roleManager.CreateAsync(
                new IdentityRole(roleName)
            );

            if (!roleResult.Succeeded)
            {
                var errors = string.Join(
                    ", ",
                    roleResult.Errors.Select(
                        error => error.Description
                    )
                );

                throw new InvalidOperationException(
                    $"{roleName} rolü oluşturulamadı: {errors}"
                );
            }
        }

        // Test amaçlı kulüp yöneticisi hesabı.
        const string managerEmail = "manager@kampus.com";
        const string managerPassword = "Manager1234";

        var managerUser =
            await userManager.FindByEmailAsync(managerEmail);

        if (managerUser is null)
        {
            managerUser = new ApplicationUser
            {
                FullName = "Test Kulüp Yöneticisi",
                Email = managerEmail,
                UserName = managerEmail,
                EmailConfirmed = true,
                Department = "Bilgisayar Mühendisliği",
                CreatedAt = DateTimeOffset.UtcNow
            };

            var createUserResult =
                await userManager.CreateAsync(
                    managerUser,
                    managerPassword
                );

            if (!createUserResult.Succeeded)
            {
                var errors = string.Join(
                    ", ",
                    createUserResult.Errors.Select(
                        error => error.Description
                    )
                );

                throw new InvalidOperationException(
                    $"Kulüp yöneticisi oluşturulamadı: {errors}"
                );
            }
        }

        var isClubManager =
            await userManager.IsInRoleAsync(
                managerUser,
                RoleNames.ClubManager
            );

        if (!isClubManager)
        {
            var addRoleResult =
                await userManager.AddToRoleAsync(
                    managerUser,
                    RoleNames.ClubManager
                );

            if (!addRoleResult.Succeeded)
            {
                var errors = string.Join(
                    ", ",
                    addRoleResult.Errors.Select(
                        error => error.Description
                    )
                );

                throw new InvalidOperationException(
                    $"Kulüp yöneticisi rolü atanamadı: {errors}"
                );
            }
        }
    }
}