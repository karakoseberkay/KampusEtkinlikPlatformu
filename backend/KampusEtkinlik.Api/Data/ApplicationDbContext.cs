using KampusEtkinlik.Api.Models; // Club Event Registration ve ApplicationUser gibi model sınıflarına erişmemizi sağlar
using Microsoft.AspNetCore.Identity.EntityFrameworkCore; // Identity tablolarını DbContext üzerinden yönetebilmemizi sağlar
using Microsoft.EntityFrameworkCore; // DbContext DbSet ilişki index gibi EF Core yapılarına erişmemizi sağlar

namespace KampusEtkinlik.Api.Data; // bu dosyanın Data katmanına ait olduğunu belirtir


public class ApplicationDbContext : IdentityDbContext<ApplicationUser> // uygulama ile veritabanı arasındaki EF Core merkezidir, Identity tablolarını da yönetir
{
    public ApplicationDbContext(DbContextOptions options) : base(options)
    // Program.csde belirlediğimiz PostgreSQL bağlantı ayarlarını DbContextOptionsa alır
    //base(options) gelen DbContext ayarlarını üst sınıf olan IdentityDbContexte gönderir
    {
    }


    public DbSet<Club> Clubs => Set<Club>(); 
    //Club entitysi üzerinden Clubs tablosunda sorgu ve kayıt işlemleri yapmamızı sağlar

    public DbSet<Event> Events => Set<Event>(); 
    // Event entitysi üzerinden Events tablosunda işlem yapmamızı sağlar

    public DbSet<Registration> Registrations => Set<Registration>(); 
    //Registration entitysi üzerinden Registrations tablosunda işlem yapmamızı sağlar


    protected override void OnModelCreating(ModelBuilder builder) 
    //override:üst sınıfta zaten bulunan OnModelCreating metodunun davranışına kendi ayarlarımızı ekliyoruz (IdentityDbContextin kendi onModelCreating metodu var)
    //tabloların ilişkilerini indexlerini ve veritabanı kurallarını belirlediğimiz metot
    {
        base.OnModelCreating(builder); //base: üst sınıfın metodunu çağırır, IdentityDbContextin kendi onModelCreating metodu çalışır
        // Identitynin kendi kullanıcı rol ve diğer tablo ayarlarını önce uygular
        //yani amaç önce identityde bulunan hazır sınıfların ayarlarını halledip sonra kendi tablolarımızın ayarlarını yapmak

        builder.Entity<ApplicationUser>().ToTable("Users"); 
            // ApplicationUser entitysi için veritabanı ayarı yapıyoruz
            // ApplicationUser kayıtlarının Users adlı tabloda tutulmasını sağlar


        builder.Entity<Club>() // Club ile ApplicationUser arasındaki yönetici ilişkisini tanımlar
            .HasOne(club => club.ManagerUser) // bir Clubın bir ManagerUserı vardır
            .WithMany(user => user.ManagedClubs) // bir kullanıcı birden fazla Club yönetebilir
            .HasForeignKey(club => club.ManagerUserId) // ilişkide foreign key olarak ManagerUserId kullanılır
            .OnDelete(DeleteBehavior.Restrict); // yönetici kullanıcı silinirse bağlı kulüpler otomatik silinmesin
              //restrict=engelle, , set null=null yap

        builder.Entity<Event>() // Event ile Club arasındaki ilişkiyi tanımlar
            .HasOne(eventItem => eventItem.Club) // bir Event bir Cluba aittir
            .WithMany(club => club.Events) // bir Clubın birden fazla Eventi olabilir
            .HasForeignKey(eventItem => eventItem.ClubId) // Event tablosundaki ClubId foreign keydir
            .OnDelete(DeleteBehavior.Cascade); // Club silinirse ona bağlı Eventler de otomatik silinir
           //cascade=otomatik sil

        builder.Entity<Registration>() // Registration ile User arasındaki ilişkiyi tanımlar
            .HasOne(registration => registration.User) // bir Registration bir Usera aittir
            .WithMany(user => user.Registrations) // bir Userın birden fazla Registration kaydı olabilir
            .HasForeignKey(registration => registration.UserId) // Registrationdaki UserId foreign keydir
            .OnDelete(DeleteBehavior.Cascade); // User silinirse ona ait Registration kayıtları da silinir
            //kayıtlar orphen olmaması için silinir
            /*burada şöyle bir durum var kullanıcı hesabı silindiğinde katıldığı etkinlik kayıtları da silinir, bu durumun kullanıcı deneyimi açısından iyi
            olup olmadığı tartışılabilir, bazı uygulamalarda kullanıcı hesabı silinse bile katıldığı etkinlik kayıtları tutulur ve kullanıcı adı yerine "Deleted User" gibi bir ifade gösterilir
            bizim amacımız kayıt öncelikli olduğu için bunun önlemini almadım*/

        builder.Entity<Registration>() // Registration ile Event arasındaki ilişkiyi tanımlar
            .HasOne(registration => registration.Event) // bir Registration bir Evente aittir
            .WithMany(eventItem => eventItem.Registrations) // bir Eventin birden fazla Registration kaydı olabilir
            .HasForeignKey(registration => registration.EventId) // Registrationdaki EventId foreign keydir
            .OnDelete(DeleteBehavior.Cascade); // Event silinirse o etkinliğe ait Registration kayıtları da silinir
            //cascade=otomatik sil

        builder.Entity<Registration>()
            .HasIndex(registration => new{ // UserId ve EventId alanlarını birlikte indexliyoruz
            //HasIndex= DB'nin hızlı ve düzenli takip etmesi için index oluşturur

                registration.UserId,
                registration.EventId
            }).IsUnique(); // aynı kullanıcının aynı etkinliğe ikinci kez kayıt olmasını veritabanı seviyesinde engeller
           


        builder.Entity<Event>()
            .Property(eventItem => eventItem.Visibility) // Eventin Visibility enum alanının veritabanında nasıl tutulacağını belirler
            //prpperty=hangi alanı ayarlıyoruz?
            .HasConversion<string>() // enumu 0 1 gibi sayı yerine Public gibi metin olarak veritabanında saklar
            .HasMaxLength(30); // veritabanındaki alanın maksimum uzunluğunu 30 karakter yapar


        builder.Entity<Event>()
            .Property(eventItem => eventItem.Status) // Eventin Status enum alanını ayarlar
            .HasConversion<string>() // enumu sayı yerine Active Cancelled gibi metin olarak veritabanında saklar
            .HasMaxLength(30); // maksimum 30 karakter saklanabilir


        builder.Entity<Registration>()
            .Property(registration => registration.ApprovalStatus) // kayıt onay durumunun veritabanında nasıl tutulacağını belirler
            .HasConversion<string>() // Pending Approved Rejected gibi metin olarak saklar
            .HasMaxLength(30); // maksimum 30 karakter saklanabilir


        builder.Entity<Event>()
            .HasIndex(eventItem => eventItem.StartDate); // tarihe göre yapılan etkinlik sorgularını hızlandırmak için index oluşturur
           //vertabanında daha hızlı bulunur aranan şey

        builder.Entity<Event>()
            .HasIndex(eventItem => eventItem.ClubId); // kulübe göre etkinlik sorgularını hızlandırmak için ClubIdye index oluşturur
    }         //aynı şekilde klüplerin etkinliklerini daha hızlı bulmak için uyguladım
}