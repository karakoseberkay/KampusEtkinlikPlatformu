using System.Security.Cryptography;
using System.Text;
using KampusEtkinlik.Api.DTOs.CheckIn;
using KampusEtkinlik.Api.Enums;
using KampusEtkinlik.Api.Models;
using KampusEtkinlik.Api.Repositories;

namespace KampusEtkinlik.Api.Services;


public sealed class EventCheckInService(
    IEventCheckInSessionRepository checkInSessionRepository,
    IRegistrationRepository registrationRepository,
    IEventRepository eventRepository
) : IEventCheckInService
{
    public async Task<CheckInSessionResponse> CreateSessionAsync(
        int eventId,
        string managerUserId,
        int expiresInMinutes,
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(
            eventId,
            cancellationToken
        );


        if (eventItem is null)
        {
            throw new KeyNotFoundException("Event not found.");
        }


        if (eventItem.Club.ManagerUserId != managerUserId)
        {
            throw new UnauthorizedAccessException(
                "You can only create a QR code for your own club's event."
            );
        }


        if (eventItem.Status == EventStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "A QR code cannot be created for a cancelled event."
            );
        }


        if (expiresInMinutes < 1 || expiresInMinutes > 120)
        {
            throw new InvalidOperationException(
                "QR code duration must be between 1 and 120 minutes."
            );
        }


        var activeSessions =
            await checkInSessionRepository.GetActiveByEventIdAsync(
                eventId,
                cancellationToken
            );


        foreach (var activeSession in activeSessions)
        {
            activeSession.IsActive = false;
        }
        // yeni qr oluşturulduğunda etkinliğin eski aktif qr kodlarını kapatır


        var rawToken = Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32)
        );
        // tahmin edilmesi zor rastgele qr tokenı oluşturur


        var tokenHash = HashToken(rawToken);
        // gerçek token yerine veritabanında hash değeri tutulur


        var now = DateTimeOffset.UtcNow;


        var session = new EventCheckInSession
        {
            EventId = eventId,
            TokenHash = tokenHash,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(expiresInMinutes),
            IsActive = true
        };


        await checkInSessionRepository.AddAsync(
            session,
            cancellationToken
        );


        await checkInSessionRepository.SaveChangesAsync(
            cancellationToken
        );


        return new CheckInSessionResponse
        {
            EventId = eventId,
            Token = rawToken,
            ExpiresAt = session.ExpiresAt
        };
    }



    public async Task<CheckInResponse> CheckInAsync(
        string userId,
        string token,
        bool isClubManager,
        CancellationToken cancellationToken = default
    )
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException(
                "QR token is required."
            );
        }


        var tokenHash = HashToken(token);


        var session = await checkInSessionRepository.GetByTokenHashAsync(
            tokenHash,
            cancellationToken
        );


        if (session is null)
        {
            throw new KeyNotFoundException(
                "QR code is invalid."
            );
        }


        if (!session.IsActive)
        {
            throw new InvalidOperationException(
                "QR code is no longer active."
            );
        }


        if (session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException(
                "QR code has expired."
            );
        }


        if (session.Event.Status == EventStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "The event has been cancelled."
            );
        }


        var registration =
            await registrationRepository.GetByUserAndEventForUpdateAsync(
                userId,
                session.EventId,
                cancellationToken
            );


        var now = DateTimeOffset.UtcNow;


        if (registration is null)
        {
            if (!isClubManager)
            {
                throw new InvalidOperationException(
                    "You are not registered for this event."
                );
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


            await registrationRepository.AddAsync(
                registration,
                cancellationToken
            );


            await registrationRepository.SaveChangesAsync(
                cancellationToken
            );


            return new CheckInResponse
            {
                RegistrationId = registration.Id,
                EventId = registration.EventId,
                CheckedInAt = registration.CheckedInAt.Value,
                Message = "Check-in completed successfully."
            };
        }


        if (registration.CheckedInAt.HasValue)
        {
            throw new InvalidOperationException(
                "You have already checked in to this event."
            );
        }


        if (!isClubManager &&
            registration.ApprovalStatus != RegistrationApprovalStatus.Approved)
        {
            throw new InvalidOperationException(
                "Your registration is not approved."
            );
        }


        if (isClubManager &&
            registration.ApprovalStatus != RegistrationApprovalStatus.Approved)
        {
            registration.ApprovalStatus = RegistrationApprovalStatus.Approved;
            // clubmanagerın mevcut kaydı varsa qr ile check-in sırasında onaylı duruma getirir
        }


        registration.CheckedInAt = now;
        // başarılı qr kontrolünden sonra kullanıcının katılım zamanını kaydeder


        await registrationRepository.SaveChangesAsync(
            cancellationToken
        );


        return new CheckInResponse
        {
            RegistrationId = registration.Id,
            EventId = registration.EventId,
            CheckedInAt = registration.CheckedInAt.Value,
            Message = "Check-in completed successfully."
        };
    }



    private static string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);

        var hashBytes = SHA256.HashData(tokenBytes);

        return Convert.ToHexString(hashBytes);
        // qr tokenını sha256 ile hashleyip veritabanında tutulacak hale getirir
    }
}