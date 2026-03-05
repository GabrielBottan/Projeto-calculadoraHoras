export function renderMetaTab(container, calc) {
  container.innerHTML = `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Meta de Faturamento -->
        <div class="glass p-6 rounded-3xl space-y-4">
          <label class="block text-sm font-medium text-slate-400 uppercase tracking-wider">Meta de Faturamento (R$)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
            <input type="number" id="input-meta" value="${calc.meta || ''}" 
              class="w-full bg-brand-navy border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold focus:border-brand-cyan outline-none transition-all"
              placeholder="0,00">
          </div>
        </div>

        <!-- Valor Hora (Reforço) -->
        <div class="glass p-6 rounded-3xl space-y-4">
          <label class="block text-sm font-medium text-slate-400 uppercase tracking-wider">Valor por Hora (R$)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
            <input type="number" id="input-valor-hora-meta" value="${calc.valorHora}" 
              class="w-full bg-brand-navy border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold focus:border-brand-cyan outline-none transition-all">
          </div>
        </div>
      </div>

      <!-- Result Card Container -->
      <div id="meta-results-container"></div>
    </div>
  `;

  const resultsContainer = container.querySelector('#meta-results-container');

  const updateResults = () => {
    const data = calc.calculateModeB(calc.meta || 0);
    const isError = !!data.error;

    resultsContainer.innerHTML = `
      <div class="glass p-8 rounded-3xl overflow-hidden relative">
        <div class="absolute top-0 right-0 p-8 opacity-10 text-brand-cyan">
          <i data-lucide="target" class="w-24 h-24"></i>
        </div>

        ${isError ? `
          <div class="text-center py-10">
            <p class="text-amber-500 font-bold text-xl">${data.error}</p>
          </div>
        ` : `
          <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div class="space-y-1">
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Horas por Dia</span>
                <p class="text-5xl font-display font-bold ${data.hoursPerDayNeeded > 10 ? 'text-amber-500' : 'text-brand-cyan'}">
                  ${data.hoursPerDayNeeded.toFixed(1)}h
                </p>
                <p class="text-xs text-slate-500">Considerando ${data.totalDays} dias úteis</p>
              </div>

              <div class="space-y-1">
                <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Total no Mês</span>
                <p class="text-5xl font-display font-bold">${data.totalHoursNeeded.toFixed(1)}h</p>
                <p class="text-xs text-slate-500">Horas totais de trabalho</p>
              </div>

              <div class="space-y-4 pt-4 md:pt-0">
                <div class="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                  <span>Viabilidade</span>
                  <span>${data.hoursPerDayNeeded > 10 ? 'Alerta' : 'OK'}</span>
                </div>
                <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full ${data.hoursPerDayNeeded > 10 ? 'bg-amber-500' : 'bg-brand-cyan'} transition-all" 
                    style="width: ${Math.min((data.hoursPerDayNeeded / 24) * 100, 100)}%"></div>
                </div>
                <p class="text-[10px] text-slate-500 italic">
                  ${data.hoursPerDayNeeded > 12 ? '⚠️ Isso exige mais de 12h de trabalho por dia.' :
        data.hoursPerDayNeeded > 8 ? 'Carga horária acima do padrão (8h).' : 'Carga horária saudável.'}
                </p>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    // Refresh icons inside dynamic content
    import('lucide').then(({ createIcons, Target }) => {
      createIcons({ icons: { Target }, nameAttr: 'data-lucide' });
    });
  };

  // Initial result render
  updateResults();

  // Listeners
  const inputMeta = container.querySelector('#input-meta');
  inputMeta.addEventListener('input', (e) => {
    calc.meta = parseFloat(e.target.value) || 0;
    updateResults(); // Surgical update
    notifyUpdate();
  });

  const inputValor = container.querySelector('#input-valor-hora-meta');
  inputValor.addEventListener('input', (e) => {
    calc.valorHora = parseFloat(e.target.value) || 0;
    updateResults(); // Surgical update
    notifyUpdate();
  });

  // Global update handler
  const handleGlobalUpdate = () => {
    if (document.activeElement !== inputMeta && document.activeElement !== inputValor) {
      inputMeta.value = calc.meta || '';
      inputValor.value = calc.valorHora;
      updateResults();
    }
  };

  window.addEventListener('pj-calc-update', handleGlobalUpdate);

  // Cleanup
  window.addEventListener('pj-cleanup-meta', () => {
    window.removeEventListener('pj-calc-update', handleGlobalUpdate);
  }, { once: true });
}

function notifyUpdate() {
  window.dispatchEvent(new CustomEvent('pj-calc-update'));
}
