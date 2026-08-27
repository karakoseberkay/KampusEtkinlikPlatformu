using KampusEtkinlik.Api.DTOs.Registrations;
using KampusEtkinlik.Api.Enums;
using KampusEtkinlik.Api.Models;
using KampusEtkinlik.Api.Repositories;

namespace KampusEtkinlik.Api.Services;

public sealed class RegistrationService(
    IRegistrationRepository registrationRepository, // kayıt veritabanı işlemlerini yapmak için repositoryi DI üzerinden alır
    IEventRepository eventRepository // kayıt olunacak etkinliği ve bağlı olduğu kulübü kontrol etmek için event repositoryi alır
) : IRegistrationService
{
    public async Task<RegistrationResponse> RegisterAsync(
        string userId, // etkinliğe kayıt olacak kullanıcının idsini alır
        int eventId, // kayıt olunacak etkinliğin idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(eventId, cancellationToken);
         // kayıt olunmak istenen etkinliği veritabanından getirir


        if (eventItem is null) // etkinlik bulunamazsa
        {
            throw new KeyNotFoundException("The event to register for was not found.");
                
            
        }


        if (eventItem.Status == EventStatus.Cancelled) // etkinlik iptal edilmiş mi kontrol eder
        {
            throw new InvalidOperationException("You cannot register for a cancelled event.");
                
            
        }


        if (eventItem.StartDate <= DateTimeOffset.UtcNow) // etkinlik başlamış veya geçmiş mi kontrol eder
        {
            throw new InvalidOperationException("You cannot register for an event that has already started or passed.");
                
            
        }


        var existingRegistration = await registrationRepository.GetByUserAndEventAsync(
            
                userId,
                eventId,
                cancellationToken
            );
        // kullanıcının aynı etkinliğe daha önce kayıt olup olmadığını kontrol eder


        if (existingRegistration is not null) // daha önce kayıt varsa
        {
            throw new InvalidOperationException("You have already registered for this event." );
                
           
        }


        var approvedCount = await registrationRepository.CountApprovedByEventAsync(
           
                eventId,
                cancellationToken
            );
        // etkinliğin mevcut Approved kayıt sayısını getirir


        if (approvedCount >= eventItem.Capacity) // onaylı kayıt sayısı kapasiteye ulaşmış mı kontrol eder
        {
            throw new InvalidOperationException("The event has reached capacity.");
                
            
        }


        var approvalStatus = eventItem.Visibility == EventVisibility.Public ? RegistrationApprovalStatus.Approved : RegistrationApprovalStatus.Pending;
        // Public etkinlikte direkt Approved, ApprovalRequired etkinlikte Pending oluşturur


        var registration = new Registration
        {
            UserId = userId, // kayıt olan kullanıcının idsi
            EventId = eventId, // kayıt olunan etkinliğin idsi
            RegisteredAt = DateTimeOffset.UtcNow, // kayıt zamanını UTC olarak kaydeder
            ApprovalStatus = approvalStatus // etkinlik türüne göre Approved veya Pending
        };


        await registrationRepository.AddAsync(registration, cancellationToken);
            
         // yeni kaydı eklenmek üzere hazırlar


        await registrationRepository.SaveChangesAsync(cancellationToken);
            
         // yeni kaydı PostgreSQL veritabanına kaydeder


        var createdRegistration = await registrationRepository.GetByIdAsync(
            
                registration.Id,
                cancellationToken
            );
        // oluşturulan kaydı User Event ve Club bilgileriyle beraber tekrar getirir(önlem)


        if (createdRegistration is null)
        {
            throw new InvalidOperationException("The registration was created but could not be retrieved.");
                
            
        }


        return MapToResponse(createdRegistration);
        // oluşturulan kaydı frontend'e uygun RegistrationResponse olarak döndürür
    }


    public async Task<IReadOnlyList<RegistrationResponse>> GetMineAsync(
        string userId, // kayıtları getirilecek kullanıcının idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var registrations = await registrationRepository.GetByUserIdAsync(
           
                userId,
                cancellationToken
            ); // kullanıcının bütün etkinlik kayıtlarını getirir


        return registrations.Select(MapToResponse).ToList();
             // Registration modellerini response DTOlarına çevirir
            
    }


    public async Task<IReadOnlyList<RegistrationResponse>> GetForEventAsync(
        int eventId, // kayıtları görüntülenecek etkinliğin idsini alır
        string managerUserId, // işlemi yapan yöneticinin kullanıcı idsini alır
        RegistrationApprovalStatus? approvalStatus = null, // isteğe bağlı kayıt durumu filtresi
        CancellationToken cancellationToken = default
    )
    {
        var eventItem = await eventRepository.GetByIdAsync(
            eventId,
            cancellationToken
        ); // kayıtları görüntülenecek etkinliği getirir


        if (eventItem is null)
        {
            throw new KeyNotFoundException("Event not found.");
                
            
        }


        if (eventItem.Club.ManagerUserId != managerUserId) // etkinlik bu managerın kulübüne mi ait kontrol eder
        {
            throw new UnauthorizedAccessException( "You can only view registrations for your own club.");
               
            
        }


        var registrations = await registrationRepository.GetByEventIdAsync(
           
                eventId,
                approvalStatus,
                cancellationToken
            ); // etkinlik kayıtlarını varsa durum filtresiyle beraber getirir


        return registrations.Select(MapToResponse).ToList();
            
            
    }


    public async Task<RegistrationResponse> ApproveAsync(
        int registrationId, // onaylanacak kayıt idsini alır
        string managerUserId, // işlemi yapan yöneticinin idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var registration = await registrationRepository.GetByIdAsync(registrationId, cancellationToken);
             // onaylanacak kaydı ilişkili bilgilerle beraber getirir


        if (registration is null)
        {
            throw new KeyNotFoundException("Registration request not found." );
                
           
        }


        EnsureManagerOwnsEvent(registration, managerUserId); //(kodu aşağıda)
        // managerın gerçekten bu etkinliğin kulübünü yönetip yönetmediğini kontrol eder


        if (registration.ApprovalStatus != RegistrationApprovalStatus.Pending){
           
        
            throw new InvalidOperationException("Only pending registration requests can be approved.");
                
            
        }


        if (registration.Event.Status == EventStatus.Cancelled){
            //etkinlik iptal edilmişse o etkinliğin bekleyen kaydı onaylanamaz
           
        
            throw new InvalidOperationException("Registration requests for cancelled events cannot be approved.");
                
            
        }


        var approvedCount = await registrationRepository.CountApprovedByEventAsync(
           
                registration.EventId,
                cancellationToken
            ); // etkinliğin mevcut Approved kayıt sayısını getirir


        if (approvedCount >= registration.Event.Capacity)
        {
            throw new InvalidOperationException("The event has reached capacity.");
                
            
        }


        registration.ApprovalStatus = RegistrationApprovalStatus.Approved;
            
        // Pending kaydı Approved durumuna geçirir


        await registrationRepository.SaveChangesAsync(cancellationToken);
         // durum değişikliğini veritabanına kaydeder


        return MapToResponse(registration);
    }


    public async Task<RegistrationResponse> RejectAsync(
        int registrationId, // reddedilecek kayıt idsini alır
        string managerUserId, // işlemi yapan yöneticinin idsini alır
        CancellationToken cancellationToken = default
    )
    {
        var registration = await registrationRepository.GetByIdAsync(registrationId, cancellationToken);
             // reddedilecek kaydı getirir


        if (registration is null)
        {
            throw new KeyNotFoundException("Registration request not found.");
                
            
        }


        EnsureManagerOwnsEvent(registration, managerUserId);            
         // managerın bu etkinliğin kulübünü yönettiğini kontrol eder


        if (registration.ApprovalStatus != RegistrationApprovalStatus.Pending)
            
        { throw new InvalidOperationException("Only pending registration requests can be rejected.");}
           
                
            
        


        registration.ApprovalStatus = RegistrationApprovalStatus.Rejected;
           
        // Pending kaydı Rejected durumuna geçirir


        await registrationRepository.SaveChangesAsync(cancellationToken);
            
         // durum değişikliğini veritabanına kaydeder


        return MapToResponse(registration);
    }


    private static void EnsureManagerOwnsEvent(
        Registration registration, // kontrol edilecek kaydı alır
        string managerUserId // işlemi yapan yöneticinin idsini alır
    )
    {
        if (registration.Event.Club.ManagerUserId != managerUserId)
           
        {
            throw new UnauthorizedAccessException("You can only manage registration requests for your own club.");
        }
        // manager başka kulübün etkinlik kayıtlarını yönetmeye çalışırsa işlemi engeller
    }


    private static RegistrationResponse MapToResponse(Registration registration){
         // responsea çevrilecek Registration modelini alır
    
    
        return new RegistrationResponse
        {
            Id = registration.Id, // kayıt idsi

            UserId = registration.UserId, // kayıt olan kullanıcının idsi

            UserFullName = registration.User?.FullName ?? string.Empty,//name null ise boş döndür
               
                // kullanıcı adı soyadı

            EventId = registration.EventId, // etkinlik idsi

            EventTitle = registration.Event?.Title ?? string.Empty, 
               
               // etkinlik başlığı

            ClubName = registration.Event?.Club?.Name ?? string.Empty, 
               
               // etkinliğin bağlı olduğu kulübün adı

            RegisteredAt = registration.RegisteredAt, // kayıt zamanı

            ApprovalStatus = registration.ApprovalStatus // Pending Approved veya Rejected durumu
        };
    }
}