/**
 * IMPORTANT: Форматирует iso-строку даты в читаемый формат
 * Возвращает "—" если дата отсутствует
 */
export function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    // NOTE: используем toLocaleString для стандартного форматирования
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

//NOTA BENE: Генерирует уникальный id для использования в dom-элементах (Требование из ТЗ)
export function getUniqIdValue() {
    return crypto.randomUUID();
}
