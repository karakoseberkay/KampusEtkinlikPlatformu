using System.Security.Claims; // jwt içindeki kullanıcı id gibi claim bilgilerine erişmek için
using KampusEtkinlik.Api.Constants; // projedeki rol isimlerini sabit olarak kullanmak için
using KampusEtkinlik.Api.Dtos.Users; // kullanıcı request ve response dtolarını kullanmak için
using KampusEtkinlik.Api.Models; // applicationuser modelini kullanmak için
using Microsoft.AspNetCore.Authorization; // authorize ile endpoint yetkilendirmesi yapmak için
using Microsoft.AspNetCore.Identity; // usermanager üzerinden kullanıcı ve rol işlemleri yapmak için
using Microsoft.AspNetCore.Mvc; // controller ve http response yapılarını kullanmak için
using Microsoft.EntityFrameworkCore; // orderby ve tolistasync gibi ef core işlemlerini kullanmak için

namespace KampusEtkinlik.Api.Controllers; // bu dosyanın controllers katmanına ait olduğunu belirtir

[ApiController] // bu classın api controller olduğunu belirtir
[Route("api/[controller]")] // endpoint adresini api/users olarak oluşturur
[Authorize(Roles = RoleNames.ClubManager)] // ilk olarak sadece clubmanager rolündeki kullanıcıların bu controllera erişmesine izin verir
public sealed class UsersController(UserManager<ApplicationUser> userManager) : ControllerBase{
     // identity üzerinden kullanıcı ve rol işlemlerini yapmak için usermanagerı di ile alır


    private const string AdminEmail = "manager@kampus.com"; // projede admin olarak kabul edilen hesabın mailini tutar

    [HttpGet] // GET api/Users endpointini oluşturur
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        if (!await IsAdminAsync()) // giriş yapan clubmanager gerçek admin hesabı değilse
        {
            return Forbid(); // kullanıcının giriş yapmış olmasına rağmen bu işlem için yetkisi olmadığını belirten 403 döndürür
        }

        var users = await userManager.Users.OrderBy(user => user.FullName).ToListAsync();
             // kullanıcıları ad soyada göre sıralar
             // sorguyu veritabanında çalıştırıp kullanıcıları liste olarak getirir

        var response = new List<UserResponse>(); // frontende gönderilecek kullanıcı listesini oluşturur

        foreach (var user in users){ // veritabanından gelen bütün kullanıcıları tek tek dolaşır
        
            var roles = await userManager.GetRolesAsync(user); // o kullanıcının identityde sahip olduğu rolleri getirir

            response.Add(new UserResponse(
                    user.Id,
                    user.FullName,
                    user.Email ?? string.Empty, // email null ise boş string kullanır
                    user.Department,
                    roles.ToArray()));} // kullanıcının rollerini array haline getirir
                
             // kullanıcı bilgilerini response listesine ekler
        

        return Ok(response); // bütün kullanıcı listesini 200 ok ile frontende döndürür
    }

    [HttpPut("{userId}/role")] // PUT api/Users/{userId}/role endpointini oluşturur
    public async Task<ActionResult<UserResponse>> UpdateRole(
        string userId, // rolü değiştirilecek kullanıcının idsini routetan alır
        UpdateUserRoleRequest request // kullanıcının yeni rol bilgisini request bodyden alır
    )
    {
        if (!await IsAdminAsync()){ // işlemi yapan kullanıcı gerçek admin hesabı değilse
        
            return Forbid(); // rol değiştirme işlemine izin vermez ve 403 döndürür
        }

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        // giriş yapan kullanıcının idsini jwt içindeki nameidentifier claiminden alır

        if (string.IsNullOrWhiteSpace(currentUserId)) // tokendan kullanıcı idsi alınamadıysa
        {
            return Unauthorized(); // 401 unauthorized döndürür
        }

        if (currentUserId == userId) // admin kendi kullanıcısının rolünü değiştirmeye çalışıyorsa
        {
            return Conflict(new
            {
                message = "Admin cannot change their own role."
            });}
            // conflict işlemin mevcut sistem durumuyla çakıştığını belirten 409 response döndürür
        

        var targetUser = await userManager.FindByIdAsync(userId);
        // rolü değiştirilecek kullanıcıyı identity üzerinden idsine göre bulur

        if (targetUser is null) // kullanıcı bulunamadıysa
        {
            return NotFound(new{
            
                message = "User not found."
            }); // 404 not found döndürür
        }

        var role = request.Role.Trim();
        // frontendden gelen rol bilgisinin başındaki ve sonundaki gereksiz boşlukları temizler

        if (role != RoleNames.Student && role != RoleNames.ClubManager){
        // gönderilen rol projede izin verilen iki rolden biri değilse
        
            return BadRequest(new
            {
                message = "Invalid role."
            }); // geçersiz rol için 400 bad request döndürür
        }

        var currentRoles = await userManager.GetRolesAsync(targetUser);
        // kullanıcının şu anda sahip olduğu bütün rolleri getirir

        var projectRoles = currentRoles.Where(currentRole => currentRole == RoleNames.Student || currentRole == RoleNames.ClubManager).ToArray();
        // mevcut roller arasından sadece projede kullandığımız student ve clubmanager rollerini seçer

        if (projectRoles.Length > 0) // kullanıcının mevcut bir proje rolü varsa
        {
            var removeResult = await userManager.RemoveFromRolesAsync(
                targetUser,
                projectRoles
            );
            // yeni rolü eklemeden önce kullanıcının mevcut student veya clubmanager rollerini kaldırır

            if (!removeResult.Succeeded) // identity rol kaldırma işlemini başarılı tamamlayamadıysa
            {
                return BadRequest(new
                {
                    errors = removeResult.Errors.Select(error => new{
                        
                        
                            error.Code,
                            error.Description
                        })
                });
                // identityden gelen hata kodlarını ve açıklamalarını frontende döndürür
            }
        }

        var addResult = await userManager.AddToRoleAsync(targetUser, role);
        // kullanıcının eski rolü kaldırıldıktan sonra seçilen yeni rolü ekler

        if (!addResult.Succeeded) // yeni rol ekleme işlemi başarısız olduysa
        {
            return BadRequest(new
            {
                errors = addResult.Errors.Select(error => new{error.Code, error.Description})
                    
            });
            // identitynin rol eklerken oluşturduğu hataları frontende döndürür
        }

        var roles = await userManager.GetRolesAsync(targetUser);
        // rol değişikliği tamamlandıktan sonra kullanıcının güncel rollerini tekrar getirir

        return Ok(
            new UserResponse(
                targetUser.Id,
                targetUser.FullName,
                targetUser.Email ?? string.Empty,
                targetUser.Department,
                roles.ToArray()
            )
        );
        // güncellenmiş kullanıcı bilgilerini 200 ok ile frontende döndürür
    }

    private async Task<bool> IsAdminAsync() // giriş yapan kullanıcının projedeki admin hesabı olup olmadığını kontrol eder
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        // jwt içindeki kullanıcı idsini alır

        if (string.IsNullOrWhiteSpace(currentUserId)) // kullanıcı idsi bulunamadıysa
        {
            return false; // admin kontrolünü başarısız sayar
        }

        var currentUser = await userManager.FindByIdAsync(currentUserId);
        // giriş yapan kullanıcıyı identity üzerinden veritabanından getirir

        if (currentUser is null) // kullanıcı veritabanında bulunamadıysa
        {
            return false; // admin olmadığını kabul eder
        }

        return string.Equals(currentUser.Email, AdminEmail, StringComparison.OrdinalIgnoreCase);
        // kullanıcının maili admin mailiyle aynıysa true döndürür
        // ordinalignorecase karşılaştırmayı büyük küçük harfe duyarsız yapar
    }
}