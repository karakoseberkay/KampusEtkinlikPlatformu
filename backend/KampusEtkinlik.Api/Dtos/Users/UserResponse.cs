namespace KampusEtkinlik.Api.Dtos.Users; // Kullanıcılarla ilgili DTOların bulunduğu namespace

public sealed record UserResponse( // Frontend'e gönderilecek kullanıcı bilgilerini taşıyan response modelidir
    string Id, // Kullanıcının Identity tarafından oluşturulan benzersiz idsini tutar
    string FullName, // Kullanıcının ad ve soyad bilgisini tutar
    string Email, // Kullanıcının e-posta adresini tutar
    string? Department, // Kullanıcının bölüm bilgisini tutar, bölüm bilgisi olmadığı için null olabilir
    string[] Roles // Kullanıcının sahip olduğu rolleri dizi halinde tutar
);