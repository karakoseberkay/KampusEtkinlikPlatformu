 
namespace KampusEtkinlik.Api.Enums; // bu dosyanın Enums klasörüne ait olduğunu belirtir


public enum EventVisibility // etkinliğe kayıt olurken onay gerekip gerekmediğini belirleyen seçenekleri tutar
{
    Public = 1, // öğrenci kayıt olduğunda direkt onaylanır

    ApprovalRequired = 2 // öğrenci kayıt olduğunda önce Pending olur ve kulüp yöneticisinin onayı gerekir
}
 
