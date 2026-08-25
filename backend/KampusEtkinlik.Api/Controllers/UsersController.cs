using System.Security.Claims; // Giriş yapan kullanıcının claim bilgilerine erişmek için
using KampusEtkinlik.Api.Constants; // Projedeki rol sabitlerini kullanmak için
using KampusEtkinlik.Api.Dtos.Users; // Kullanıcı request ve response DTOlarını kullanmak için
using KampusEtkinlik.Api.Models; // ApplicationUser modelini kullanmak için
using Microsoft.AspNetCore.Authorization; // Role göre yetkilendirme yapmak için
using Microsoft.AspNetCore.Identity; // ASP.NET Identity kullanıcı işlemleri için
using Microsoft.AspNetCore.Mvc; // Controller ve HTTP response yapılarını kullanmak için
using Microsoft.EntityFrameworkCore; // ToListAsync gibi Entity Framework metodları için

namespace KampusEtkinlik.Api.Controllers;

[ApiController] // Bu classın API controller olduğunu belirtir
[Route("api/[controller]")] // Endpoint adresini api/Users olarak oluşturur
[Authorize(Roles = RoleNames.ClubManager)] // Sadece ClubManager rolündeki kullanıcıların erişmesini sağlar
public sealed class UsersController(UserManager<ApplicationUser> userManager) // Kullanıcı ve rol işlemleri için UserManager alır
    : ControllerBase
{
    private const string AdminEmail = "manager@kampus.com"; // Projede admin olarak kabul edilen hesabın e-postası

    [HttpGet] // GET api/Users endpointini oluşturur
    public async Task<ActionResult<List<UserResponse>>> GetAll(){
        if (!await IsAdminAsync()) // Giriş yapan kullanıcı gerçek admin hesabı değilse
        {
            return Forbid(); // 403 Forbidden döndürür
        }

        var users = await userManager.Users.OrderBy(user => user.FullName).ToListAsync();
             // Kullanıcıları ada göre sıralar
             // Kullanıcı listesini veritabanından getirir

        var response = new List<UserResponse>(); // Frontende gönderilecek kullanıcı listesini oluşturur

        foreach (var user in users){ // Bütün kullanıcıları tek tek dolaşır
        
            var roles = await userManager.GetRolesAsync(user); // Kullanıcının sahip olduğu rolleri getirir

            response.Add(
                new UserResponse(
                    user.Id,
                    user.FullName,
                    user.Email ?? string.Empty, // Email null ise boş string kullanır
                    user.Department,
                    roles.ToArray()));} // Rolleri array haline getirir

        return Ok(response); // Kullanıcı listesini 200 OK ile döndürür
    }

    [HttpPut("{userId}/role")] // PUT api/Users/{userId}/role endpointini oluşturur
    public async Task<ActionResult<UserResponse>> UpdateRole(
        string userId, UpdateUserRoleRequest request){
       
    
        if (!await IsAdminAsync()) // İşlemi yapan kullanıcı admin değilse
        {
            return Forbid(); // Rol değiştirmesine izin vermez
        }

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Token içinden giriş yapan kullanıcının IDsini alır

        if (string.IsNullOrWhiteSpace(currentUserId)){ // Kullanıcı IDsi bulunamadıysa
        
            return Unauthorized(); // 401 Unauthorized döndürür
        }

        if (currentUserId == userId){ // Admin kendi hesabının rolünü değiştirmeye çalışıyorsa
        
            return Conflict(new{
            
                message = "Admin kendi rolünü değiştiremez."
            });
        }

        var targetUser = await userManager.FindByIdAsync(userId); // Rolü değiştirilecek kullanıcıyı ID ile bulur

        if (targetUser is null) // Kullanıcı bulunamazsa
        {
            return NotFound(new
            {
                message = "Kullanıcı bulunamadı."
            });
        }

        var role = request.Role.Trim(); // Requestten gelen rolün başındaki ve sonundaki boşlukları temizler

        if (
            role != RoleNames.Student &&
            role != RoleNames.ClubManager
        ) // Gelen rol projede izin verilen rollerden biri değilse
        {
            return BadRequest(new
            {
                message = "Geçersiz rol."
            });
        }

        var currentRoles = await userManager.GetRolesAsync(targetUser); // Kullanıcının mevcut rollerini getirir

        var projectRoles = currentRoles
            .Where(currentRole =>
                currentRole == RoleNames.Student ||
                currentRole == RoleNames.ClubManager
            ) // Sadece projede kullanılan Student ve ClubManager rollerini seçer
            .ToArray();

        if (projectRoles.Length > 0) // Kullanıcının mevcut proje rolü varsa
        {
            var removeResult = await userManager.RemoveFromRolesAsync(
                targetUser,
                projectRoles
            ); // Eski rollerini kaldırır

            if (!removeResult.Succeeded) // Rol kaldırma işlemi başarısız olduysa
            {
                return BadRequest(new
                {
                    errors = removeResult.Errors
                        .Select(error => new
                        {
                            error.Code,
                            error.Description
                        })
                });
            }
        }

        var addResult = await userManager.AddToRoleAsync(
            targetUser,
            role
        ); // Kullanıcıya yeni rolü ekler

        if (!addResult.Succeeded) // Yeni rol eklenemezse
        {
            return BadRequest(new
            {
                errors = addResult.Errors
                    .Select(error => new
                    {
                        error.Code,
                        error.Description
                    })
            });
        }

        var roles = await userManager.GetRolesAsync(targetUser); // Güncelleme sonrası kullanıcının rollerini tekrar getirir

        return Ok(
            new UserResponse(
                targetUser.Id,
                targetUser.FullName,
                targetUser.Email ?? string.Empty,
                targetUser.Department,
                roles.ToArray()
            )
        ); // Güncellenmiş kullanıcı bilgisini 200 OK ile döndürür
    }

    private async Task<bool> IsAdminAsync() // Giriş yapan kullanıcının admin hesabı olup olmadığını kontrol eder
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Token içinden mevcut kullanıcının IDsini alır

        if (string.IsNullOrWhiteSpace(currentUserId)) // Kullanıcı IDsi yoksa
        {
            return false;
        }

        var currentUser = await userManager.FindByIdAsync(currentUserId); // Kullanıcıyı veritabanından getirir

        if (currentUser is null) // Kullanıcı bulunamazsa
        {
            return false;
        }

        return string.Equals(
            currentUser.Email,
            AdminEmail,
            StringComparison.OrdinalIgnoreCase
        ); // Kullanıcının e-postası admin e-postasıyla aynıysa true döndürür
    }
}