using KampusEtkinlik.Api.Models; // ApplicationUser modeline erişmemizi sağlar


namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir


public sealed record TokenResult( // oluşturulan JWT ile tokenın bitiş tarihini birlikte döndürmek için kullanılan veri yapısı
   //record veri taşımak için kullanılır
    string AccessToken, // oluşturulan JWT access token değerini tutar
    DateTimeOffset ExpiresAtUtc // tokenın UTC olarak hangi tarihte biteceğini tutar
);


public interface ITokenService // JWT oluşturma işleminin sözleşmesini tanımlar
{
    TokenResult CreateToken( // kullanıcı ve rollerine göre yeni JWT oluşturur ve TokenResult döndürür
        ApplicationUser user, // token oluşturulacak kullanıcı bilgilerini alır
        IEnumerable<string> roles // kullanıcının Student veya ClubManager gibi rollerini alır
        // IEnumerable=birden fazla string değer üzerinde sırayla gezilebilir bir koleksiyon, List=listeleme yapabilen koleksiyon
    );
}