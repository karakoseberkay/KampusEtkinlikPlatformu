export function formatDateTime(value: string | null | undefined): string { // backendden gelen tarih bilgisini kullanıcıya daha okunabilir şekilde göstermek için
  if (!value) {
    return '-'; // tarih bilgisi yoksa boş görünmek yerine tire gösterir
  }

  const date = new Date(value); // backendden gelen ISO tarih bilgisini JavaScript Date nesnesine çevirir

  if (Number.isNaN(date.getTime())) {
    return value; // tarih geçerli şekilde çevrilemezse gelen değeri olduğu gibi gösterir
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date); // tarihi kullanıcının yerel saatine göre 05.09.2026 14:32 gibi gösterir
}