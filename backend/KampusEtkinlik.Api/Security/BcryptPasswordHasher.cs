using KampusEtkinlik.Api.Models; // ApplicationUser modeline erişmemizi sağlar
using Microsoft.AspNetCore.Identity; // IPasswordHasher ve PasswordVerificationResult gibi Identity parola yapılarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Security; // bu dosyanın Security katmanına ait olduğunu belirtir


public sealed class BcryptPasswordHasher
    : IPasswordHasher<ApplicationUser> // Identity'nin parola hashleme sözleşmesini BCrypt ile gerçekleştirir
{
    public string HashPassword(
        ApplicationUser user, // parolası hashlenecek kullanıcı nesnesi
        string password) // kullanıcının düz metin parolası
    {
        ArgumentNullException.ThrowIfNull(user); // user null gelirse işlemi hata ile durdurur
        ArgumentException.ThrowIfNullOrWhiteSpace(password); // parola boş veya sadece boşluksa işlemi durdurur

        return BCrypt.Net.BCrypt.HashPassword(password); // parolayı BCrypt ile geri çözülemeyen hash haline getirir
    }


    public PasswordVerificationResult VerifyHashedPassword(
        ApplicationUser user, // parolası kontrol edilen kullanıcı
        string hashedPassword, // veritabanında saklanan BCrypt hash değeri
        string providedPassword) // kullanıcının login sırasında yazdığı parola
    {
        ArgumentNullException.ThrowIfNull(user); // user null ise işlemi hata ile durdurur


        if (string.IsNullOrWhiteSpace(hashedPassword) ||
            string.IsNullOrWhiteSpace(providedPassword)) // kayıtlı hash veya girilen parola boşsa doğrulama yapmaz
        {
            return PasswordVerificationResult.Failed; // parola doğrulamasını başarısız döndürür
        }


        var isValid = BCrypt.Net.BCrypt.Verify(
            providedPassword,
            hashedPassword
        ); // girilen parolanın veritabanındaki BCrypt hash ile eşleşip eşleşmediğini kontrol eder


        return isValid
            ? PasswordVerificationResult.Success // parola doğruysa başarılı sonucu döndürür
            : PasswordVerificationResult.Failed; // parola yanlışsa başarısız sonucu döndürür
    }
}