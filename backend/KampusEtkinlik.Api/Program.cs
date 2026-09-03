using System.Security.Claims; //C#’ın güvenlik ve kullanıcı kimliğiyle ilgili Claims sınıflarını bu dosyada kullanabilmemizi sağlar, silersek claimleri System.Security.Claims.ClaimTypes.Name bu şekilde yazmamız gerekir
// claim kullanıcı hakkında taşınan küçük bir bilgidir (adı,idsi gibi) jwt işlemlerinde kullanılır

using System.Text; //System.Text namespace’i içerisindeki metin dönüştürme sınıflarını kullanmamızı sağlar
//jwt tokenları metin yerine byte dizisi olarak saklar bu yüzden metin dönüştürme sınıflarına ihtiyaç duyarız

using KampusEtkinlik.Api.Repositories; //Projenizdeki repository interface ve sınıflarına erişmemizi sağlar, bu repoyu çalıştırmaz sadece tanıtmaya yarar
using KampusEtkinlik.Api.Data; //Projenizdeki Data klasöründe bulunan sınıflara erişmemizi sağlar
using KampusEtkinlik.Api.Models; //Projedeki model sınıflarına erişmemizi sağlar.
using KampusEtkinlik.Api.Security; //Projedeki security sınıflarına erişmemizi sağlar.
using KampusEtkinlik.Api.Services; //Projenizdeki Service interface ve sınıflarına erişmemizi sağlar.
using Microsoft.AspNetCore.Authentication; //Projenizdeki Service interface ve sınıflarına erişmemizi sağlar.
/* Authentication scheme, backend’in kullanıcıyı hangi yöntemle doğrulayacağını tanımlayan isimlendirilmiş bir authentication yöntemidir.
bu projede bearer kullandım (jwt tokeninin önüne bearer eklenir) alternatif olarak cookieste kullanılabilirdi */

using Microsoft.AspNetCore.Authentication.JwtBearer; // bu satır bearer kullanılmasını sağlıyor
using Microsoft.AspNetCore.Authorization; // yetkilendirme sınıflarına erişimi sağlıyor
using Microsoft.AspNetCore.Identity; //Identity sınıflarına erişmemizi sağlar
/* Identity, kullanıcı ve rol yönetimi için kullanılan hazır altyapı*/
// Identity kullanıcıyı bulur ve parolayı doğrular => TokenService JWT üretir => Sonraki isteklerde JwtBearer JWT’yi doğrular

using Microsoft.AspNetCore.OpenApi; // OpenApi sınıflarına erişmemizi sağlar, buna bir nevi pcb diyebiliriz endpointlerin künyesini taşıyor çeşitleri var ÖNEMLİ!!
using Microsoft.EntityFrameworkCore; //Entity Framework Core sınıflarına ve extension metotlarına erişmemizi sağlar - EF Core ve DbContext kurulumu
using Microsoft.IdentityModel.Tokens;  //Bu satır JWT’nin imzasını ve doğrulama kurallarını tanımlayan sınıflara erişmemizi sağlar.
//SymmetricSecurityKey ile alakalı ÖNEMLİ!!

using Microsoft.OpenApi; //Swagger/OpenAPI belge sınıfları
using System.Text.Json.Serialization; //Bu satır .NET’in JSON dönüştürme sınıflarına erişmemizi sağlar.
// bu converter sayesinde bekleme onaylandı reddedildi durumlarını sayı olarak değil metin olarak alabiliyoruz daha anlaşılır olmasını sağlıyor - olmasada olur ama karmaşıklığı azaltıyor

var builder = WebApplication.CreateBuilder(args); // uygulamayı hazırlayacağımız bir builder nesnesi oluşturuyor

builder.Services.AddControllers().AddJsonOptions(options =>{
    //Controller’ların çalışması için gerekli altyapıyı ekliyor ve API’de enum değerlerinin daha anlaşılır JSON metinleri olarak gönderilmesini sağlıyor
    
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
            
    

builder.Services.AddOpenApi(options =>{ //Swagger’a bu API’nin JWT Bearer kullandığını tanıtır

    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>(); // tek bir endpoint’i değil, OpenAPI belgesinin genelini düzenlediği için document transform kullanılıyor ve bu kod swaggera jwt yöntemini genel olarak tanıtır
    options.AddOperationTransformer<BearerSecurityRequirementTransformer>(); // sweagerın endpointleri tek tek birbirinden ayrı inceleyip tokwn istiyen endpointi görsel olarak göstermesini sağlar yani hangi endpointin jwt istediğini belirler
});
/*
Gerçek hayat örneği:

Bir binayı düşün.

Birinci transformer şunu söyler:

Bu binada kartlı geçiş sistemi var.

İkinci transformer ise kapıları tek tek inceler:

Giriş kapısı  Kart gerekiyor
Kafeterya  Kart gerekmiyor
Sunucu odası  Kart gerekiyor

Yani:

Security scheme
 Sistemde hangi güvenlik yöntemi var?

Security requirement
 Bu endpoint o güvenlik yöntemini istiyor mu?

*/

builder.Services.AddDataProtection(); // Bu satır, uygulamanın veri koruma hizmetlerini ekler. Veri koruma, hassas verilerin şifrelenmesini ve güvenli bir şekilde saklanmasını sağlar. Örneğin, kullanıcı parolaları veya diğer hassas bilgiler bu hizmet aracılığıyla korunabilir.
// normal bir istek atıldığında bu komut çalışmaz sadece başlangıçta çalışr

builder.Services.AddCors(options => // anguların gelip bağlanmasını sağlayan cors ayarlarını yapıyor, anguların localhost:4200 portundan gelen istekleri kabul etmesini sağlıyor
{
    options.AddPolicy("AngularClient",
        // bu policy ismi ile anguların bağlanmasını sağlıyoruz, farklı porta farklı isim varilir
        policy => //koşulların yazıldığı yer
        {
            policy.WithOrigins("http://localhost:4200", "https://campusbody-azure.vercel.app").AllowAnyHeader().AllowAnyMethod(); //header: bearer gibi ek bilgiler, method: post get put delete
        }
    ); // .allowanyorigins yazılabilir ama bu bütün web adreslerine izin verir
});

var connectionString =builder.Configuration.GetConnectionString("DefaultConnection")
// postgre ile bağlantıyı sağlıyor(veri tabanı detayları defaultconnection altında appsettings.jsonda yazıyor)
    //veri tabanı bilgileri user secrets ile gizlendi gösteren terminal kodu: dotnet user-secrets list --project backend/KampusEtkinlik.Api
    ?? throw new InvalidOperationException( "Database connection information was not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>//her http isteğinde bir applicationdbcontext nesnesi oluşturur 
{ //bir kullanıcı yeni istek gönderdiğinde yeni bir scope ve yeni DbContext oluşturulur ve işlem sonu silinir
    options.UseNpgsql(connectionString);
    //connectionstringi postgresql ile bağlayan yapı
});

builder.Services.AddIdentityCore<ApplicationUser>(options => // kullanıcının eposta parolalarına kurallar ekler
    {
        options.User.RequireUniqueEmail = true; //benzersiz e posta

        options.Password.RequiredLength = 8; // parola karakter sayısı
        options.Password.RequireDigit = true; // rakam zorunluluğu 
        options.Password.RequireLowercase = true;// küçük harf zorunluluğu
        options.Password.RequireUppercase = true;// büyük harf zorunluluğu
        options.Password.RequireNonAlphanumeric = false;// özel karakter zorunluluğu
    })
    .AddRoles<IdentityRole>()  // Student ve ClubManager gibi kullanıcı rollerini yönetir
    .AddEntityFrameworkStores<ApplicationDbContext>() // Identity kullanıcı ve rol verilerini PostgreSQL'de saklar.
    .AddSignInManager() // Kullanıcının giriş yapma ve parola kontrolü işlemlerini yönetir.
    .AddDefaultTokenProviders(); // Kullanıcı doğrulama ve parola sıfırlama gibi işlemler için gerekli token sağlayıcılarını ekler.

builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, BcryptPasswordHasher>();
//Parola hashleme veya parola doğrulama gerektiğinde BcryptPasswordHasher sınıfı kullanılır

var jwtKey = builder.Configuration["Jwt:Key"] // JWT'yi imzalamak ve doğrulamak için kullanılan gizli anahtarı alır
    ?? throw new InvalidOperationException("Jwt:Key setting was not found.");

//dotnet user-secrets list --project backend/KampusEtkinlik.Api

var jwtIssuer = builder.Configuration["Jwt:Issuer"]// JWT'yi üreten sistemin adını alır.
    ?? throw new InvalidOperationException("Jwt:Issuer setting was not found.");


var jwtAudience = builder.Configuration["Jwt:Audience"] // JWT'nin hangi uygulama için üretildiğini belirtir.
    ?? throw new InvalidOperationException("Jwt:Audience setting was not found.");



builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => //kimlik doğrulama yöntemi olarak JWT Bearer kullıypor
    {// AddJwtBearer gelen JWT access tokenlarının doğrulama ayarlarını belirliyor
        options.SaveToken = true; // doğrulanan jwtnin backend authentication bilgileri içinde saklanmasını sağlar.

        options.TokenValidationParameters = new TokenValidationParameters{ //jwt'nin geçerli sayılması için uygulanacak kontrol kurallarını tanımlar

                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer, //jwtnin geçerli sayılması için beklenen issuer değeri
                ValidAudience = jwtAudience, // jwtnin geçerli sayılması için beklenen audience değeri

                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), //jwt'nin geçerli sayılması için beklenen imza anahtarı, jwtkeyi byte dizisine çeviriyor

                NameClaimType = ClaimTypes.Name, // Kullanıcı adının hangi claim'den okunacağını belirtir.
                RoleClaimType = ClaimTypes.Role, // Kullanıcının rollerinin hangi claim'den okunacağını belirtir.

                ClockSkew = TimeSpan.Zero // Token'ın geçerlilik süresine eklenen tolerans süresi, default olarak 5 dakika eklenir, sıfırlarsak token süresi dolduğunda hemen geçersiz olur
            };
    });

builder.Services.AddAuthorization(); // authorize ve rol bazlı yetkilendirme sistemini uygulamaya ekler


builder.Services.AddScoped<ITokenService, TokenService>(); // ITokenService istendiğinde TokenService kullanır, JWT üretme işlemlerini buraya bağlar 

 /*Böylece controller doğrudan:

new TokenService(...)

yapmak zorunda kalmaz.
*/

/*
ITokenService
 ne yapılacağını söyler

TokenService
 nasıl yapılacağını gerçekleştirir
*/

builder.Services.AddScoped<IClubRepository, ClubRepository>(); // IClubRepository istendiğinde ClubRepository kullanır, kulüp veritabanı işlemlerini buraya bağlar


builder.Services.AddScoped<IClubService, ClubService>(); // IClubService istendiğinde ClubService kullanır, kulüp iş kurallarını buraya bağlar


builder.Services.AddScoped<IEventRepository, EventRepository>(); // IEventRepository istendiğinde EventRepository kullanır, etkinlik veritabanı işlemlerini buraya bağlar


builder.Services.AddScoped<IEventService, EventService>(); // IEventService istendiğinde EventService kullanır, etkinlik iş kurallarını buraya bağlar


builder.Services.AddScoped<IRegistrationRepository, RegistrationRepository>(); // IRegistrationRepository istendiğinde RegistrationRepository kullanır, kayıt veritabanı işlemlerini buraya bağlar


builder.Services.AddScoped<IRegistrationService, RegistrationService>(); // IRegistrationService istendiğinde RegistrationService kullanır, kayıt iş kurallarını buraya bağlar


builder.Services.AddScoped<IEventCheckInSessionRepository, EventCheckInSessionRepository>();
// qr oturumu veritabanı işlemlerini repositorye bağlar


builder.Services.AddScoped<IEventCheckInService, EventCheckInService>();
// qr oluşturma ve öğrenci check-in iş kurallarını servise bağlar


var app = builder.Build(); // yukarıda tanımladığımız servis ve ayarlardan gerçek web uygulamasını oluşturur

// production ortamında api response güvenlik headerlarını ekler
if (!app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";

        context.Response.Headers["Strict-Transport-Security"] =
            "max-age=31536000";

        context.Response.Headers["Cross-Origin-Resource-Policy"] =
            "cross-origin";

        await next();
    });
}

app.MapOpenApi();
// openapi json dokümanını yayınlar schemathesis gibi otomatik api test araçları bunu kullanır

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/openapi/v1.json",
            "Campus Event API v1"
        );
    });
}
/*
MapOpenApi
 API açıklamasını JSON olarak hazırlar

UseSwaggerUI
 o açıklamayı okunabilir web ekranına çevirir(sweager)
*/

app.UseHttpsRedirection(); // http isteklerini https kullanmaya yönlendirir

app.UseCors("AngularClient"); // yukarıda oluşturduğumuz AngularClient cors politikasını gelen isteklerde uygular

app.UseAuthentication(); // gelen JWTyi doğrular ve kullanıcıyı claimleriyle oluşturur
app.UseAuthorization(); // doğrulanan kullanıcının endpoint için yetkisi veya rolü var mı kontrol eder

app.MapControllers(); // controllerlardaki routeları gerçek api endpointlerine bağlar


await IdentitySeeder.SeedRolesAsync(app.Services); // uygulama başlarken gerekli Identity rollerini (student ve clubmanager )veritabanında oluşturur varsa ellemez
//await: bu iş tamamlanınca sonucu ver, sonra aşağı devam et

app.Run(); // web uygulamasını çalıştırır ve gelen http isteklerini dinlemeye başlar


//internal: sadece bu proje için kullanılsın dışarıdan erişim olmasın demek sealed ise bu sınıf başka sınıflar tarafından kalıtılamaz demek
internal sealed class BearerSecuritySchemeTransformer(IAuthenticationSchemeProvider authenticationSchemeProvider ) : IOpenApiDocumentTransformer{
    // sistemde kayıtlı authentication yöntemlerini okumamızı sağlar bu sınıfın openapi dokümanının genelini düzenleyeceğini belirtir

    public async Task /*task: işlem değişken döndürmeden tamamlandı*/ TransformAsync( // openapi dokümanı oluşturulurken çalışır
        OpenApiDocument document, // oluşturulan openapi dokümanı
        OpenApiDocumentTransformerContext context, // transformerın ihtiyaç duyduğu ek bilgiler taşır (authorize, allowanonymous gibi)
        CancellationToken cancellationToken // işlem iptal edilmek istenirse kullanılabilecek token
    )
    {
        var authenticationSchemes =await authenticationSchemeProvider.GetAllSchemesAsync();
        // sistemde kayıtlı tüm authentication yöntemlerini getirir
            ////await: bu iş tamamlanınca sonucu ver, sonra aşağı devam et

        var hasBearerScheme = authenticationSchemes.Any(scheme => //listedeki her elemanı sırayla temsil eder
                
                    scheme.Name == JwtBearerDefaults.AuthenticationScheme); // sistemde Bearer authentication kayıtlı mı kontrol eder


        if (!hasBearerScheme) // bearer yoksa swaggera jwt güvenlik bilgisi ekleme
        {
            return;
        }


        var securitySchemes =
            new Dictionary /*anahtar değer*/<string, IOpenApiSecurityScheme> // swaggera eklenecek güvenlik yöntemlerini tutar
            {
                ["Bearer"] = new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http, // güvenlik yönteminin HTTP tabanlı olduğunu belirtir
                    Scheme = "bearer", // bearer authentication kullanıldığını belirtir
                    In = ParameterLocation.Header, // tokenın HTTP header içinde gönderileceğini belirtir
                    BearerFormat = "JWT", // bearer tokenın JWT formatında olduğunu belirtir
                    Description ="Enter the JWT access token received from the login operation." // swaggerdaki kullanıcı açıklaması
                } //Yani Swaggera anlatıyoruz: Bizim API'de Bearer isimli bir güvenlik yöntemi var. HTTP header üzerinden gönderiliyor ve token JWT formatında
            };


        document.Components ??= new OpenApiComponents(); // components yoksa yeni bir components alanı oluşturur

        document.Components.SecuritySchemes = securitySchemes; // Bearer güvenlik şemasını openapi dokümanına ekler (eğer üst satırda component oluşturulmamışsa burası patlar)
    }
}



internal sealed class BearerSecurityRequirementTransformer : IOpenApiOperationTransformer{// bu sınıf her endpointi ayrı ayrı inceleyip düzenler
//nu sınıf jwt isteyen authorize endpointleri swaggerda görsel olarak işaretler allowanonymous endpointleri işaretlemez!!
    public Task /*task: işlem değişken döndürmeden tamamlandı*/ TransformAsync( // her endpointin swagger bilgisi oluşturulurken çalışır
        OpenApiOperation operation, // o an incelenen endpointin openapi bilgisi
        OpenApiOperationTransformerContext context, // endpoint hakkında ek bilgileri taşır (authorize, allowanonymous gibi)
        CancellationToken cancellationToken // işlem iptal edilmek istenirse kullanılabilecek token
    )
    {
        var endpointMetadata = context.Description.ActionDescriptor.EndpointMetadata; //endpointMetadata endpoint üzerindeki authorize gibi attributeları taşır


        var requiresAuthorization = endpointMetadata.OfType<IAuthorizeData>().Any();
        // authorize bilgilerini seçer
                 // en az bir authorize varsa true olur


        var allowsAnonymous =endpointMetadata.OfType<IAllowAnonymous>().Any();
        // allowanonymous bilgilerini seçer
                 // allowanonymous varsa true olur


        if (!requiresAuthorization || allowsAnonymous) // endpoint token istemiyorsa security bilgisi eklemeden çık
        {
            return Task.CompletedTask;
        }


        operation.Security ??= []; // endpointin security listesi yoksa boş liste oluşturur


        operation.Security.Add(new OpenApiSecurityRequirement{[
             // bu endpointin Bearer JWT gerektirdiğini swaggera ekler
            
                    new OpenApiSecuritySchemeReference("Bearer", context.Document)] = [] // yukarıda tanımladığımız Bearer güvenlik şemasını kullanır 
                    // // mevcut yukarıda tanımladığımız openapi (bearer) dokümanındaki Bearer tanımına referans verir
                    
                 //buradaki boş liste, bu güvenlik şeması için ayrıca scope gibi ekstra bilgiler istemediğimizi belirtiyor
            });
        


        return Task.CompletedTask; // yapılacak işlem tamamlandı bilgisini döndürür
    }
}