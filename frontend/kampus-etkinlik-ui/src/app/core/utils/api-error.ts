import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(
  error: HttpErrorResponse,//backendden gelen hata
  fallback = 'İşlem sırasında bir hata oluştu.' //hiçbir uygun hata mesajı bulunamazsa gösterilecek varsayılan mesaj
): string { // backendden gelen hata cevaplarını kullanıcıya gösterilecek mesaja çevirir

  if (error.status === 0) {
    return 'Backend bağlantısı kurulamadı.'; // backend ulaşılamıyorsa bağlantı hatası döndürür
  }

  if (typeof error.error?.message === 'string') {
    return error.error.message; // backend message alanı gönderdiyse direkt onu döndürür
  }

  const errors = error.error?.errors;

  if (Array.isArray(errors)) { // backend hata listesini array olarak gönderdiyse mesajları birleştirir
    const message = errors
      .map(item => item?.description ?? item?.code)
      .filter(Boolean)
      .join(' | ');

    if (message) {
      return message;
    }
  }

  if (errors && typeof errors === 'object') { // validation hataları object olarak geldiyse içindeki mesajları alır
    const messages = Object.values(errors)
      .flatMap(value => Array.isArray(value) ? value : [value])//iç içe dizileri tek dize haline getiriyor
      .filter(value => typeof value === 'string');

    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  if (typeof error.error === 'string') {
    return error.error; // backend direkt string hata gönderdiyse onu döndürür
  }

  return fallback; // uygun hata mesajı bulunamazsa varsayılan mesajı döndürür
}