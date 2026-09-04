using System.Security.Cryptography; // RandomNumberGenerator ve SHA256 gibi güvenli şifreleme araçlarını kullanmamızı sağlar
using System.Text; // token metnini byte dizisine çevirmek için Encoding sınıfını kullanmamızı sağlar
using KampusEtkinlik.Api.DTOs.CheckIn; // check-in request ve response DTOlarına erişmemizi sağlar
using KampusEtkinlik.Api.Enums; // EventStatus ve RegistrationApprovalStatus enumlarına erişmemizi sağlar
using KampusEtkinlik.Api.Models; // EventCheckInSession ve Registration modellerine erişmemizi sağlar
using KampusEtkinlik.Api.Repositories; // qr oturumu etkinlik ve kayıt repositorylerine erişmemizi sağlar

namespace KampusEtkinlik.Api.Services; // bu dosyanın Services katmanına ait olduğunu belirtir

public sealed class EventCheckInService(
    IEventCheckInSessionRepository checkInSessionRepository,
    IRegistrationRepository registrationRepository,
    IEventRepository eventRepository
) : IEventCheckInService
// qr oluşturma token kontrolü ve kullanıcının etkinliğe girişini kaydetme işlemlerini gerçekleştirir
{
    public async Task<CheckInSessionResponse> CreateSessionAsync(int eventId, string managerUserId, int expiresInMinutes, CancellationToken cancellationToken = default)
    {
        var eventItem = await eventRepository.GetByIdAsync(eventId, cancellationToken);
        // qr oluşturulacak etkinliği veritabanından getirir

        if (eventItem is null)
        {
            throw new KeyNotFoundException("Event not found."); // etkinlik bulunamazsa işlemi durdurur
        }

        if (eventItem.Club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException("You can only create a QR code for your own club's event.");
            // qr oluşturan managerın etkinliğin bağlı olduğu kulübün yöneticisi olup olmadığını kontrol eder
        }

        if (eventItem.Status == EventStatus.Cancelled)
        {
            throw new InvalidOperationException("A QR code cannot be created for a cancelled event.");
            // iptal edilmiş etkinlik için qr oluşturulmasını engeller
        }

        if (expiresInMinutes < 1 || expiresInMinutes > 120)
        {
            throw new InvalidOperationException("QR code duration must be between 1 and 120 minutes.");
            // qr süresinin 1 ile 120 dakika arasında olmasını kontrol eder
        }

        var activeSessions = await checkInSessionRepository.GetActiveByEventIdAsync(eventId, cancellationToken);
        // etkinliğe ait daha önce oluşturulmuş aktif qr oturumlarını getirir

        foreach (var activeSession in activeSessions)
        {
            activeSession.IsActive = false;
        }
        // yeni qr oluşturulduğunda etkinliğin eski aktif qr kodlarını kapatır

        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        // RandomNumberGenerator güvenli şekilde 32 rastgele byte oluşturur Convert.ToHexString ise bunları metne çevirir

        var tokenHash = HashToken(rawToken);
        // gerçek token yerine veritabanında hash değeri tutulur

        var now = DateTimeOffset.UtcNow;
        // sunucunun saat diliminden bağımsız olarak şu anki UTC zamanını alır

        var session = new EventCheckInSession
        {
            EventId = eventId,
            TokenHash = tokenHash,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(expiresInMinutes), // oluşturulma zamanına seçilen dakika eklenerek bitiş zamanı hesaplanır
            IsActive = true
        };
        // veritabanına kaydedilecek yeni qr oturumunu oluşturur

        await checkInSessionRepository.AddAsync(session, cancellationToken);
        // yeni qr oturumunu EF Core tarafında eklenmek üzere hazırlar

        await checkInSessionRepository.SaveChangesAsync(cancellationToken);
        // yeni qr oturumunu ve eski qrların IsActive değişikliklerini veritabanına kaydeder

        return new CheckInSessionResponse
        {
            EventId = eventId,
            Token = rawToken,
            ExpiresAt = session.ExpiresAt
        };
        // frontendin qr oluşturabilmesi için gerçek tokenı ve geçerlilik zamanını geri döndürür
    }

    public async Task<CheckInResponse> CheckInAsync(string userId, string token, bool isClubManager, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("QR token is required.");
            // token null boş veya sadece boşluklardan oluşuyorsa işlemi durdurur
        }

        var tokenHash = HashToken(token);
        // qr içinden gelen gerçek tokenı veritabanındaki değerle karşılaştırabilmek için hashler

        var session = await checkInSessionRepository.GetByTokenHashAsync(tokenHash, cancellationToken);
        // hash değerine ait qr oturumunu veritabanından getirir

        if (session is null)
        {
            throw new KeyNotFoundException("QR code is invalid.");
            // hash değerine ait qr oturumu yoksa qr geçersiz kabul edilir
        }

        if (!session.IsActive)
        {
            throw new InvalidOperationException("QR code is no longer active.");
            // qr daha önce devre dışı bırakılmışsa kullanılmasını engeller
        }

        if (session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException("QR code has expired.");
            // qrın bitiş zamanı geçmişse check-in yapılmasını engeller
        }

        if (session.Event.Status == EventStatus.Cancelled)
        {
            throw new InvalidOperationException("The event has been cancelled.");
            // qr geçerli olsa bile etkinlik iptal edilmişse giriş yapılmasını engeller
        }

        var registration = await registrationRepository.GetByUserAndEventForUpdateAsync(userId, session.EventId, cancellationToken);
        // kullanıcının bu etkinlikteki kaydını CheckedInAt alanını değiştirebilmek için takipli olarak getirir

        var now = DateTimeOffset.UtcNow;
        // başarılı check-in işleminde kullanılacak güncel UTC zamanını alır

        if (registration is null)
        {
            if (!isClubManager)
            {
                throw new InvalidOperationException("You are not registered for this event.");
                // studentın etkinliğe kaydı yoksa check-in yapılmasını engeller
            }

            registration = new Registration
            {
                UserId = userId,
                EventId = session.EventId,
                RegisteredAt = now,
                ApprovalStatus = RegistrationApprovalStatus.Approved,
                CheckedInAt = now
            };
            // clubmanagerın kaydı yoksa qr okutunca otomatik onaylı kayıt oluşturur

            await registrationRepository.AddAsync(registration, cancellationToken);
            // oluşturulan clubmanager kaydını EF Core tarafında eklenmek üzere hazırlar

            await registrationRepository.SaveChangesAsync(cancellationToken);
            // oluşturulan kaydı veritabanına kaydeder

            return new CheckInResponse
            {
                RegistrationId = registration.Id,
                EventId = registration.EventId,
                CheckedInAt = registration.CheckedInAt.Value,
                Message = "Check-in completed successfully."
            };
            // başarılı clubmanager check-in sonucunu frontende döndürür
        }

        if (registration.CheckedInAt.HasValue)
        {
            throw new InvalidOperationException("You have already checked in to this event.");
            // HasValue CheckedInAt alanında daha önce bir tarih olup olmadığını kontrol eder
        }

        if (!isClubManager && registration.ApprovalStatus != RegistrationApprovalStatus.Approved)
        {
            throw new InvalidOperationException("Your registration is not approved.");
            // studentın kaydı Approved değilse check-in yapılmasını engeller
        }

        if (isClubManager && registration.ApprovalStatus != RegistrationApprovalStatus.Approved)
        {
            registration.ApprovalStatus = RegistrationApprovalStatus.Approved;
            // clubmanagerın mevcut kaydı varsa qr ile check-in sırasında onaylı duruma getirir
        }

        registration.CheckedInAt = now;
        // başarılı qr kontrolünden sonra kullanıcının katılım zamanını kaydeder

        await registrationRepository.SaveChangesAsync(cancellationToken);
        // CheckedInAt ve varsa ApprovalStatus değişikliklerini veritabanına kaydeder

        return new CheckInResponse
        {
            RegistrationId = registration.Id,
            EventId = registration.EventId,
            CheckedInAt = registration.CheckedInAt.Value,
            Message = "Check-in completed successfully."
        };
        // başarılı check-in sonucunu frontende döndürür
    }

    private static string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        // Encoding.UTF8 token metnini SHA256nın işleyebileceği byte dizisine çevirir

        var hashBytes = SHA256.HashData(tokenBytes);
        // SHA256 tokenın geri çevrilemeyen sabit uzunlukta hash değerini oluşturur

        return Convert.ToHexString(hashBytes);
        // hash byte dizisini veritabanında string olarak saklayabilmek için hex metnine çevirir
    }
}