namespace KampusEtkinlik.Api.DTOs.Common; // Sayfalama işlemlerinde kullanılan ortak DTOların bulunduğu namespace

public sealed class PagedResponse<T> //buradaki T generic type yani sadece tek bir page için değil farklı pageleride sayfalamayı sağlıyor
{
    public IReadOnlyList<T> Items { get; set; } = []; // İstenen sayfada bulunan kayıtları tutar, T hangi veri tipinin listeleneceğini belirtir

    public int Page { get; set; } // Kullanıcının şu anda bulunduğu sayfa numarasını tutar

    public int PageSize { get; set; } // Bir sayfada kaç kayıt gösterileceğini belirtir

    public int TotalCount { get; set; } // Filtrelere uygun toplam kayıt sayısını tutar

    public int TotalPages { get; set; } // Toplam kayıt sayısına göre oluşan toplam sayfa sayısını tutar
}