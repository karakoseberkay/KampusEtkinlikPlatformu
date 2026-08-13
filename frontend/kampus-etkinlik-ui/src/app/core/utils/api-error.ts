import {
  HttpErrorResponse
} from '@angular/common/http';


export function getApiErrorMessage(
  error: HttpErrorResponse,
  fallback = 'İşlem sırasında bir hata oluştu.'
): string {

  if (error.status === 0) {
    return 'Backend bağlantısı kurulamadı.';
  }


  if (
    typeof error.error?.message === 'string'
  ) {
    return error.error.message;
  }


  const errors =
    error.error?.errors;


  if (Array.isArray(errors)) {
    const message =
      errors
        .map(
          item =>
            item?.description
            ?? item?.code
        )
        .filter(Boolean)
        .join(' | ');

    if (message) {
      return message;
    }
  }


  if (
    errors
    && typeof errors === 'object'
  ) {
    const messages =
      Object.values(errors)
        .flatMap(
          value =>
            Array.isArray(value)
              ? value
              : [value]
        )
        .filter(
          value =>
            typeof value === 'string'
        );

    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }


  if (
    typeof error.error === 'string'
  ) {
    return error.error;
  }


  return fallback;
}
