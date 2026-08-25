using KampusEtkinlik.Api.Constants; // RoleNames içindeki Student ve ClubManager sabitlerine erişmemizi sağlar
using KampusEtkinlik.Api.Models; // ApplicationUser modeline erişmemizi sağlar
using Microsoft.AspNetCore.Identity; // RoleManager UserManager ve IdentityRole sınıflarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Data; // bu dosyanın Data katmanına ait olduğunu belirtir


public static class IdentitySeeder // uygulama başlarken gerekli rol ve test kullanıcılarını oluşturan sınıftır
{
    public static async Task SeedRolesAsync(IServiceProvider services) // DI sisteminden gerekli Identity servislerini alıp başlangıç verilerini oluşturur
    {
        using var scope = services.CreateScope(); // uygulama servisleri içinde geçici bir scope oluşturur


        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        // rol oluşturma kontrol etme gibi işlemleri yapacak RoleManager servisini DI sisteminden alır
        //getrequiredservice = servis yoksa hata fırlatır, getservice=servis yoksa null döndürür

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
         // kullanıcı bulma oluşturma parola ve rol işlemlerini yapacak UserManager servisini DI sisteminden alır
         //getrequiredservice = servis yoksa hata fırlatır, getservice=servis yoksa null döndürür

       
        foreach (var roleName in RoleNames.All) // RoleNames içindeki tüm rolleri tek tek gezer(kontrol eder)
        {
            if (await roleManager.RoleExistsAsync(roleName)) // rol veritabanında zaten var mı kontrol eder
            {
                continue; // rol varsa tekrar oluşturmadan sonraki role geçer (student or manager)
            }


            var roleResult = await roleManager.CreateAsync(new IdentityRole(roleName));
             // rol yoksa yeni IdentityRole oluşturup veritabanına kaydeder
             //creareasync bize true ya da false döndürür, rol oluşturulursa true döner, hata olursa false döner ve aşağıdaki if bloğu çalışır

            if (!roleResult.Succeeded) // rol oluşturma başarısız olduysa hata bilgilerini hazırlar
            {
                var errors = string.Join(
                    ", ",
                    roleResult.Errors.Select(
                        error => error.Description
                    )
                ); // Identityden gelen bütün hata mesajlarını tek bir metinde birleştirir


                throw new InvalidOperationException(
                    $"{roleName} role could not be created: {errors}"
                ); // rol oluşturulamadıysa uygulamayı açık bir hata mesajıyla durdurur
            }
        }


        // Test amaçlı kulüp yöneticisi hesabı.
        const string managerEmail = "manager@kampus.com"; // test ClubManager hesabının eposta adresi
        const string managerPassword = "Manager1234"; // test ClubManager hesabının parolası


        var managerUser = await userManager.FindByEmailAsync(managerEmail);
        // test yöneticisi daha önce oluşturulmuş mu eposta üzerinden kontrol eder


        if (managerUser is null) // test yöneticisi yoksa yeni kullanıcı oluşturur
        {
            managerUser = new ApplicationUser
            {
                FullName = "Admin", // test kullanıcısının ad soyadı
                Email = managerEmail, // test kullanıcısının epostası
                UserName = "Admin", // Identity kullanıcı adı olarak epostayı kullanır
                EmailConfirmed = true, // test hesabının epostasını doğrulanmış kabul eder
                Department = "Management", // test kullanıcısının bölüm bilgisi
                CreatedAt = DateTimeOffset.UtcNow // kullanıcının oluşturulma tarihini UTC olarak kaydeder
            };


            var createUserResult = await userManager.CreateAsync(managerUser, managerPassword);
            // kullanıcıyı verilen parola ile Identity üzerinden oluşturur, parola burada hashlenecektir


            if (!createUserResult.Succeeded) // kullanıcı oluşturma başarısızsa hata bilgilerini toplar
            {
                var errors = string.Join(
                    ", ",
                    createUserResult.Errors.Select(
                        error => error.Description
                    )
                ); // kullanıcı oluşturma hatalarını tek metinde birleştirir


                throw new InvalidOperationException(
                    $"Club manager could not be created: {errors}"
                ); // test kullanıcısı oluşturulamazsa uygulamayı hata ile durdurur
            }
        }


        var isClubManager =await userManager.IsInRoleAsync(managerUser, RoleNames.ClubManager);
        // test kullanıcısının ClubManager rolüne sahip olup olmadığını kontrol eder


        if (!isClubManager) // kullanıcı ClubManager değilse rolü ekler
        {
            var addRoleResult =
                await userManager.AddToRoleAsync( // addRoleResult=Bu kullanıcıyla bu rolü birbirine bağla
                    managerUser,
                    RoleNames.ClubManager
                );
            // kullanıcıyı ClubManager rolüne ekler


            if (!addRoleResult.Succeeded) // rol atama başarısız olduysa hata bilgilerini toplar
            {
                var errors = string.Join(
                    ", ",
                    addRoleResult.Errors.Select(
                        error => error.Description
                    )
                ); // rol atama hatalarını tek metinde birleştirir


                throw new InvalidOperationException(
                    $"Club manager role could not be assigned: {errors}"
                ); // rol atanamazsa uygulamayı hata ile durdurur
            }
        }
    }
}