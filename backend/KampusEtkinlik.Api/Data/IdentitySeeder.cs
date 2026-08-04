using KampusEtkinlik.Api.Constants;
using Microsoft.AspNetCore.Identity;

namespace KampusEtkinlik.Api.Data;

public static class IdentitySeeder
{
    public static async Task SeedRolesAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var roleManager =
            scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var roleName in RoleNames.All)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(
                new IdentityRole(roleName)
            );

            if (!result.Succeeded)
            {
                var errors = string.Join(
                    ", ",
                    result.Errors.Select(error => error.Description)
                );

                throw new InvalidOperationException(
                    $"{roleName} rolü oluşturulamadı: {errors}"
                );
            }
        }
    }
}