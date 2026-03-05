const CACHE_KEY = 'pj_calc_holidays_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Fallback constant for national holidays if API fails
const FALLBACK_HOLIDAYS = [
    { date: '2026-01-01', name: 'Confraternização Universal' },
    { date: '2026-04-03', name: 'Sexta-feira Santa' },
    { date: '2026-04-21', name: 'Tiradentes' },
    { date: '2026-05-01', name: 'Dia do Trabalho' },
    { date: '2026-09-07', name: 'Independência do Brasil' },
    { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
    { date: '2026-11-02', name: 'Finados' },
    { date: '2026-11-15', name: 'Proclamação da República' },
    { date: '2026-12-25', name: 'Natal' }
];

export async function getHolidays(year) {
    const cached = localStorage.getItem(`${CACHE_KEY}_${year}`);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
            console.log('Using cached holidays for', year);
            return data;
        }
    }

    try {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        localStorage.setItem(`${CACHE_KEY}_${year}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));

        return data;
    } catch (error) {
        console.warn('BrasilAPI failed, using local fallback:', error);
        // Return fallback filtered by year if possible or just the fallback
        return FALLBACK_HOLIDAYS.filter(h => h.date.startsWith(year.toString()));
    }
}

export function isHoliday(date, holidays) {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateStr);
}
