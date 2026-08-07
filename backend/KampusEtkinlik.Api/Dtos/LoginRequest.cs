using System.ComponentModel.DataAnnotations; // Required ve EmailAddress gibi doğrulama attributelarını kullanmamızı sağlar

namespace KampusEtkinlik.Api.Dtos; // bu dosyanın Dtos klasörüne ait olduğunu belirtir


public sealed class LoginRequest // frontendden login endpointine gelecek giriş bilgilerini taşır
{
    [Required] // Email alanının boş gönderilmesini engeller
    [EmailAddress] // gönderilen değerin geçerli eposta formatında olup olmadığını kontrol eder
    public string Email { get; init; } = string.Empty; // kullanıcının giriş için gönderdiği eposta bilgisini alır


    [Required] // Password alanının boş gönderilmesini engeller
    public string Password { get; init; } = string.Empty; // kullanıcının giriş sırasında gönderdiği parolayı alır
}