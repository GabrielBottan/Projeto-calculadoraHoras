import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isWeekend,
    getDay,
    format,
    parseISO,
    isSameDay
} from 'date-fns';

export class PJCalculator {
    constructor() {
        this.valorHora = 0;
        this.baseHoursPerDay = 8;
        this.workDays = [1, 2, 3, 4, 5]; // Mon to Fri
        this.includeWeekends = false;
        this.includeHolidays = false;
        this.overrides = new Map(); // dateStr -> { hours: number, active: boolean }
        this.holidays = [];
        this.currentDate = new Date();
    }

    setHolidays(holidays) {
        this.holidays = holidays;
    }

    setMonth(date) {
        this.currentDate = date;
    }

    getDaysInMonth() {
        const start = startOfMonth(this.currentDate);
        const end = endOfMonth(this.currentDate);
        return eachDayOfInterval({ start, end });
    }

    isWorkDay(date) {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Check overrides first
        if (this.overrides.has(dateStr)) {
            return this.overrides.get(dateStr).active;
        }

        const dayIdx = getDay(date);
        const isHolidayDate = this.holidays.some(h => h.date === dateStr);

        // Rule 1: Holiday logic
        if (isHolidayDate && !this.includeHolidays) return false;

        // Rule 2: Weekend logic
        if (isWeekend(date) && !this.includeWeekends) return false;

        // Rule 3: Defined work days
        return this.workDays.includes(dayIdx);
    }

    getHoursForDay(date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (this.overrides.has(dateStr)) {
            const ov = this.overrides.get(dateStr);
            return ov.active ? ov.hours : 0;
        }
        return this.isWorkDay(date) ? this.baseHoursPerDay : 0;
    }

    calculateModeA() {
        const days = this.getDaysInMonth();
        let totalHours = 0;
        let workDaysCount = 0;

        const dayDetails = days.map(date => {
            const hours = this.getHoursForDay(date);
            if (hours > 0) workDaysCount++;
            totalHours += hours;

            return {
                date,
                hours,
                value: hours * this.valorHora,
                isWorkDay: hours > 0,
                type: this.getDayType(date)
            };
        });

        const totalValue = totalHours * this.valorHora;

        return {
            totalHours,
            totalValue,
            workDaysCount,
            dayDetails,
            avgValuePerDay: workDaysCount > 0 ? totalValue / workDaysCount : 0
        };
    }

    calculateModeB(meta) {
        const days = this.getDaysInMonth();
        const workDays = days.filter(d => this.isWorkDay(d));
        const totalDays = workDays.length;

        if (totalDays === 0 || this.valorHora === 0) {
            return { error: 'Inviável: Sem dias de trabalho ou valor/hora zero.' };
        }

        const totalHoursNeeded = meta / this.valorHora;
        const hoursPerDayNeeded = totalHoursNeeded / totalDays;

        return {
            totalHoursNeeded,
            hoursPerDayNeeded,
            totalDays,
            isViable: hoursPerDayNeeded <= 24, // Basic check, UI can alert for < 10h
            dayDetails: days.map(date => ({
                date,
                hours: this.isWorkDay(date) ? hoursPerDayNeeded : 0,
                isWorkDay: this.isWorkDay(date)
            }))
        };
    }

    getDayDetails(date) {
        const hours = this.getHoursForDay(date);
        return {
            hours,
            isWorkDay: hours > 0,
            type: this.getDayType(date)
        };
    }

    getDayType(date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (this.holidays.some(h => h.date === dateStr)) return 'holiday';
        if (isWeekend(date)) return 'weekend';
        return 'weekday';
    }

    addOverride(date, hours, active = true) {
        const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
        this.overrides.set(dateStr, { hours, active });
    }

    removeOverride(date) {
        const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
        this.overrides.delete(dateStr);
    }
}
