export function renderGainTab(container, calc) {
  container.innerHTML = `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Valor Hora -->
        <div class="glass p-6 rounded-3xl space-y-4">
          <label class="block text-sm font-medium text-slate-400 uppercase tracking-wider">Valor por Hora (R$)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
            <input type="number" id="input-valor-hora" value="${calc.valorHora}" 
              class="w-full bg-brand-navy border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold focus:border-brand-cyan outline-none transition-all"
              placeholder="0,00">
          </div>
        </div>

        <!-- Horas por Dia -->
        <div class="glass p-6 rounded-3xl space-y-4">
          <label class="block text-sm font-medium text-slate-400 uppercase tracking-wider">Horas Base por Dia</label>
          <div class="flex items-center gap-4">
            <input type="range" id="input-base-hours" min="0" max="24" step="0.5" value="${calc.baseHoursPerDay}" 
              class="flex-1 accent-brand-cyan">
            <span id="display-base-hours" class="text-2xl font-bold min-w-[60px] text-right">${calc.baseHoursPerDay}h</span>
          </div>
        </div>
      </div>

      <!-- Configurações Rápidas -->
      <div class="glass p-6 rounded-3xl">
        <h4 class="text-sm font-bold text-slate-500 uppercase mb-6">Configurações de Dias Trabalhados</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <button data-preset="5" class="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-center flex flex-col items-center justify-center gap-1 w-full h-full border border-transparent hover:border-slate-500">
                <span class="text-sm font-medium text-slate-100">Seg a Sex</span>
                <span class="text-[10px] text-slate-400">Padrão 8h</span>
              </button>
              
              <button data-preset="6" class="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-center flex flex-col items-center justify-center gap-1 w-full h-full border border-transparent hover:border-slate-500">
                <span class="text-sm font-medium text-slate-100">Escala 6x1</span>
                <span class="text-[10px] text-slate-400">Seg a Sáb</span>
              </button>

              <button data-preset="7" class="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-center flex flex-col items-center justify-center gap-1 w-full h-full border border-transparent hover:border-slate-500">
                <span class="text-sm font-medium text-slate-100">Todos os Dias</span>
                <span class="text-[10px] text-slate-400">Sem folgas</span>
              </button>

              <button id="btn-reset" class="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all text-center flex flex-col items-center justify-center gap-1 w-full h-full border border-transparent hover:border-red-500/30">
                <span class="text-sm font-medium text-red-500">Resetar App</span>
                <span class="text-[10px] text-red-500/60">Zerar Tudo</span>
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <label class="flex items-center gap-3 cursor-pointer group">
              <div class="relative">
                <input type="checkbox" id="chk-weekends" ${calc.includeWeekends ? 'checked' : ''} class="sr-only peer">
                <div class="w-12 h-6 bg-slate-800 rounded-full peer peer-checked:bg-brand-cyan transition-all"></div>
                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
              </div>
              <span class="text-sm font-medium text-slate-300">Incluir Fins de Semana</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer group">
              <div class="relative">
                <input type="checkbox" id="chk-holidays" ${calc.includeHolidays ? 'checked' : ''} class="sr-only peer">
                <div class="w-12 h-6 bg-slate-800 rounded-full peer peer-checked:bg-brand-cyan transition-all"></div>
                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
              </div>
              <span class="text-sm font-medium text-slate-300">Incluir Feriados</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `;

  // Listeners
  const inputValor = container.querySelector('#input-valor-hora');
  inputValor.addEventListener('input', (e) => {
    calc.valorHora = parseFloat(e.target.value) || 0;
    notifyUpdate();
  });

  const inputBase = container.querySelector('#input-base-hours');
  const displayBase = container.querySelector('#display-base-hours');
  inputBase.addEventListener('input', (e) => {
    calc.baseHoursPerDay = parseFloat(e.target.value);
    displayBase.textContent = `${calc.baseHoursPerDay}h`;
    notifyUpdate();
  });

  const chkWeekends = container.querySelector('#chk-weekends');
  const lblWeekends = chkWeekends.closest('label');
  lblWeekends.addEventListener('click', (e) => {
    // Only process if the click isn't directly on the checkbox to prevent double-firing
    if (e.target.tagName !== 'INPUT') {
      chkWeekends.checked = !chkWeekends.checked;
    }
    calc.includeWeekends = chkWeekends.checked;
    notifyUpdate();
  });

  const chkHolidays = container.querySelector('#chk-holidays');
  const lblHolidays = chkHolidays.closest('label');
  lblHolidays.addEventListener('click', (e) => {
    if (e.target.tagName !== 'INPUT') {
      chkHolidays.checked = !chkHolidays.checked;
    }
    calc.includeHolidays = chkHolidays.checked;
    notifyUpdate();
  });

  container.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.dataset.preset);

      // Limpa os ajustes individuais caso existam
      calc.overrides.clear();

      if (days === 5) {
        calc.workDays = [1, 2, 3, 4, 5]; // Seg a Sex
        calc.includeWeekends = false;
        if (chkWeekends) chkWeekends.checked = false;
      } else if (days === 6) {
        calc.workDays = [1, 2, 3, 4, 5, 6]; // Seg a Sab
        calc.includeWeekends = true;
        if (chkWeekends) chkWeekends.checked = true;
      } else if (days === 7) {
        calc.workDays = [0, 1, 2, 3, 4, 5, 6]; // Dom a Sab
        calc.includeWeekends = true;
        if (chkWeekends) chkWeekends.checked = true;
      }

      calc.baseHoursPerDay = 8;
      inputBase.value = "8";
      displayBase.textContent = "8h";

      notifyUpdate();
    });
  });

  const btnReset = container.querySelector('#btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja apagar todas as configurações e zerar a calculadora?')) {
        calc.valorHora = 0;
        calc.baseHoursPerDay = 8;
        calc.workDays = [1, 2, 3, 4, 5];
        calc.includeWeekends = false;
        calc.includeHolidays = false;
        calc.overrides.clear();

        inputValor.value = '';
        inputBase.value = '8';
        displayBase.textContent = '8h';
        chkWeekends.checked = false;
        chkHolidays.checked = false;

        notifyUpdate();
      }
    });
  }

  // Global update handler to keep inputs in sync without full re-render
  const handleGlobalUpdate = () => {
    if (document.activeElement !== inputValor && document.activeElement !== inputBase) {
      inputValor.value = calc.valorHora || '';
      inputBase.value = calc.baseHoursPerDay;
      displayBase.textContent = `${calc.baseHoursPerDay}h`;
    }
  };

  window.addEventListener('pj-calc-update', handleGlobalUpdate);

  // Cleanup
  window.addEventListener('pj-cleanup-gain', () => {
    window.removeEventListener('pj-calc-update', handleGlobalUpdate);
  }, { once: true });
}

function notifyUpdate() {
  window.dispatchEvent(new CustomEvent('pj-calc-update'));
}
