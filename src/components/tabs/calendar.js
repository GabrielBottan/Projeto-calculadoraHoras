import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function renderCalendarTab(container, calc) {
  const start = startOfMonth(calc.currentDate);
  const end = endOfMonth(calc.currentDate);
  const days = eachDayOfInterval({ start, end });

  container.innerHTML = `
    <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="glass p-6 rounded-3xl">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h4 class="font-display text-xl font-bold">Calendário de Ajustes</h4>
          <div class="flex gap-2">
            <span class="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span class="w-2.5 h-2.5 rounded-full bg-brand-cyan"></span> Trabalho
            </span>
            <span class="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-800"></span> Folga
            </span>
          </div>
        </div>

        <div class="grid grid-cols-7 gap-2 mb-2">
          ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => `
            <div class="text-center text-[10px] uppercase font-bold text-slate-500 py-2">${d}</div>
          `).join('')}
        </div>

        <div id="calendar-grid" class="grid grid-cols-7 gap-2">
          ${days.map(date => renderDayCell(date, calc)).join('')}
        </div>
      </div>

      <!-- Override Panel -->
      <div id="override-panel" class="hidden glass p-6 rounded-3xl animate-in zoom-in duration-200">
        <div class="flex justify-between items-center mb-4">
          <h5 id="selected-date-title" class="font-bold text-brand-cyan capitalize">Data</h5>
          <button id="close-override" class="text-slate-500 hover:text-white">✕</button>
        </div>
        <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
          <label class="flex items-center gap-3 cursor-pointer group">
            <div class="relative">
              <input type="checkbox" id="override-active" class="sr-only peer">
              <div class="w-12 h-6 bg-slate-800 rounded-full peer peer-checked:bg-brand-cyan transition-all"></div>
              <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
            </div>
            <span class="text-sm font-medium">Vou trabalhar neste dia</span>
          </label>
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-400">Horas:</span>
            <input type="number" id="override-hours" step="0.5" min="0" max="24" 
              class="w-24 bg-brand-navy border border-slate-800 rounded-xl py-2 px-3 text-center font-bold outline-none focus:border-brand-cyan">
          </div>
        </div>
      </div>
    </div>
  `;

  const grid = container.querySelector('#calendar-grid');
  const panel = container.querySelector('#override-panel');
  const panelTitle = container.querySelector('#selected-date-title');
  const chkActive = container.querySelector('#override-active');
  const inputHours = container.querySelector('#override-hours');
  let selectedDate = null;

  const setupDayListeners = () => {
    container.querySelectorAll('.calendar-day').forEach(dayEl => {
      dayEl.onclick = () => {
        selectedDate = dayEl.dataset.date;
        const date = new Date(selectedDate + 'T00:00:00');
        const details = calc.getDayDetails(date);

        // Immediate toggle on click
        const isNowActive = !(details.hours > 0);
        const newHours = isNowActive ? (details.hours || calc.baseHoursPerDay) : 0;

        calc.addOverride(selectedDate, newHours, isNowActive);

        panelTitle.textContent = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
        chkActive.checked = isNowActive;
        inputHours.value = newHours || calc.baseHoursPerDay;
        inputHours.disabled = !isNowActive;

        panel.classList.remove('hidden');

        updateDayCellUI(selectedDate, date);
        window.dispatchEvent(new CustomEvent('pj-calc-update'));
      };
    });
  };

  setupDayListeners();

  chkActive.onchange = (e) => {
    inputHours.disabled = !e.target.checked;
    updateOverride();
  };

  inputHours.oninput = updateOverride;

  container.querySelector('#close-override').onclick = () => {
    panel.classList.add('hidden');
  };

  function updateDayCellUI(dateStr, dateObj) {
    const dayEl = grid.querySelector(`[data-date="${dateStr}"]`);
    if (dayEl) {
      const innerCard = dayEl.querySelector('div');
      if (innerCard) {
        // Atualiza apenas o miolo de texto interno sem destruir a estrutura CSS e Borda da caixa
        innerCard.innerHTML = renderDayCellInner(dateObj, calc);

        const isWork = calc.getDayDetails(dateObj).hours > 0;

        if (isWork) {
          innerCard.classList.remove('bg-brand-navy/50', 'border-slate-800', 'text-slate-500');
          innerCard.classList.add('bg-brand-cyan/10', 'border-brand-cyan/30', 'text-white');
        } else {
          innerCard.classList.remove('bg-brand-cyan/10', 'border-brand-cyan/30', 'text-white');
          innerCard.classList.add('bg-brand-navy/50', 'border-slate-800', 'text-slate-500');
        }
      }
    }
  }

  function updateOverride() {
    if (!selectedDate) return;
    const date = new Date(selectedDate + 'T00:00:00');
    const hours = chkActive.checked ? parseFloat(inputHours.value) || 0 : 0;

    calc.addOverride(selectedDate, hours, chkActive.checked);

    updateDayCellUI(selectedDate, date);

    window.dispatchEvent(new CustomEvent('pj-calc-update'));
  }
}

function renderDayCell(date, calc) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayDetails = calc.getDayDetails(date);
  const isWork = dayDetails.hours > 0;
  const isTodayDate = isSameDay(date, new Date());

  return `
    <div class="calendar-day relative group cursor-pointer" data-date="${dateStr}">
      <div class="aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all 
        ${isWork ? 'bg-brand-cyan/10 border-brand-cyan/30 text-white' : 'bg-brand-navy/50 border-slate-800 text-slate-500'}
        ${isTodayDate ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-navy' : ''}
        hover:scale-105 active:scale-95">
        ${renderDayCellInner(date, calc)}
      </div>
    </div>
  `;
}

function renderDayCellInner(date, calc) {
  const dayDetails = calc.getDayDetails(date);
  return `
    <span class="text-sm font-bold">${format(date, 'd')}</span>
    <span class="text-[10px] opacity-70 mt-1">${dayDetails.hours}h</span>
  `;
}
