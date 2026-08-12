using System.ComponentModel.DataAnnotations; // Required EmailAddress MinLength MaxLength gibi doğrulama attributelarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Dtos; // bu dosyanın Dtos klasörüne ait olduğunu belirtir


public sealed class RegisterRequest // frontendden register endpointine gelecek kayıt bilgilerini taşır
{
    [Required] // FullName alanının boş gönderilmesini engeller
    [MaxLength(150)] //en fazla 150 karakter olabilir
    public string FullName { get; init; } = string.Empty; 
    // kullanıcının ad soyad bilgisini alır


    [Required] // Email alanının boş gönderilmesini engeller
    [EmailAddress] // gönderilen değerin eposta formatında olup olmadığını kontrol eder
    [MaxLength(256)] // Email en fazla 256 karakter olabilir
    public string Email { get; init; } = string.Empty; 
    // kullanıcının eposta bilgisini alır


    [Required] // Password alanının boş gönderilmesini engeller
    [MinLength(8)] // parola en az 8 karakter olmalı
    [MaxLength(100)] // parola en fazla 100 karakter olabilir
    public string Password { get; init; } = string.Empty; 
    // kullanıcının kayıt sırasında gönderdiği düz metin parolayı alır


    [MaxLength(150)] // Department doluysa en fazla 150 karakter olabilir
    public string? Department { get; init; } 
    // kullanıcının bölüm bilgisini alır, boş bırakılabilir
}