 
namespace KampusEtkinlik.Api.Enums; // bu dosyanın Enums klasörüne ait olduğunu belirtir


public enum RegistrationApprovalStatus // etkinlik kayıtlarının onay durumlarını tutar
{
    Pending = 1, // kayıt yöneticinin onayını bekliyor

    Approved = 2, // kayıt kulüp yöneticisi tarafından onaylanmış

    Rejected = 3 // kayıt kulüp yöneticisi tarafından reddedilmiş
}
 
