/**
 * Utilitários para manipulação de datas
 * Evita problemas de fuso horário ao trabalhar com datas locais
 */

/**
 * Converte uma data para formato ISO (YYYY-MM-DD) usando a data local
 * Evita problemas de fuso horário que podem ocorrer com toISOString()
 * 
 * @param date - Data a ser convertida (opcional, padrão é a data atual)
 * @returns String no formato YYYY-MM-DD
 */
export const getLocalDateISO = (date: Date = new Date()): string => {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0');
};

/**
 * Converte uma data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
 * 
 * @param brazilianDate - Data no formato DD/MM/YYYY
 * @returns String no formato YYYY-MM-DD
 */
export const convertBrazilianDateToISO = (brazilianDate: string): string => {
  const [day, month, year] = brazilianDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Converte uma data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
 * 
 * @param isoDate - Data no formato YYYY-MM-DD
 * @returns String no formato DD/MM/YYYY
 */
export const convertISODateToBrazilian = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Obtém a data atual no formato brasileiro (DD/MM/YYYY)
 * 
 * @returns String no formato DD/MM/YYYY
 */
export const getTodayBrazilian = (): string => {
  const today = new Date();
  return today.toLocaleDateString('pt-BR');
};

/**
 * Obtém a data atual no formato ISO (YYYY-MM-DD) usando data local
 * 
 * @returns String no formato YYYY-MM-DD
 */
export const getTodayISO = (): string => {
  return getLocalDateISO();
};