namespace KampusEtkinlik.Api.Dtos; 

public sealed record AuthResponse( // register login ve me işlemlerinden frontend'e dönecek kullanıcı ve token bilgilerini taşır
    string UserId, // kullanıcının idsini döndürür
    string FullName, // kullanıcının ad soyad bilgisini döndürür
    string Email, // kullanıcının eposta bilgisini döndürür
    IReadOnlyCollection<string> Roles, // kullanıcının Student veya ClubManager gibi rollerini döndürür
    string AccessToken, // frontendin sonraki isteklerde kullanacağı JWT access tokenı döndürür
    DateTimeOffset ExpiresAtUtc // JWTnin hangi tarihte geçersiz olacağını UTC olarak döndürür
);