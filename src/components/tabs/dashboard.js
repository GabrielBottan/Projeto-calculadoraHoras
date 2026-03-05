import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function renderDashboardTab(container, calc) {
    const data = calc.calculateModeA();

    container.innerHTML = `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Gráfico de Horas Diárias -->
        <div class="glass p-6 rounded-3xl col-span-1 md:col-span-2">
          <h4 class="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Carga Horária Diária</h4>
          <canvas id="chart-daily-hours" class="max-h-[300px]"></canvas>
        </div>

        <!-- Distribuição por Tipo de Dia -->
        <div class="glass p-6 rounded-3xl">
          <h4 class="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Uso do Tempo</h4>
          <canvas id="chart-day-types" class="max-h-[300px]"></canvas>
        </div>

        <!-- Progressão Acumulada -->
        <div class="glass p-6 rounded-3xl col-span-1 md:col-span-3">
          <h4 class="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Evolução do Faturamento (Estimado)</h4>
          <canvas id="chart-accumulated" class="max-h-[300px]"></canvas>
        </div>
      </div>
    </div>
  `;

    const brandCyan = '#1FB5FF';
    const brandNavy = '#0E1B31';

    // Daily Hours Chart
    const ctxDaily = container.querySelector('#chart-daily-hours').getContext('2d');
    new Chart(ctxDaily, {
        type: 'bar',
        data: {
            labels: data.dayDetails.map(d => format(d.date, 'dd')),
            datasets: [{
                label: 'Horas',
                data: data.dayDetails.map(d => d.hours),
                backgroundColor: brandCyan,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Day Types Chart
    const ctxTypes = container.querySelector('#chart-day-types').getContext('2d');
    const workCount = data.dayDetails.filter(d => d.hours > 0).length;
    const offCount = data.dayDetails.length - workCount;

    new Chart(ctxTypes, {
        type: 'doughnut',
        data: {
            labels: ['Trabalho', 'Folga'],
            datasets: [{
                data: [workCount, offCount],
                backgroundColor: [brandCyan, '#1e293b'],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            cutout: '70%'
        }
    });

    // Accumulated Progress Chart
    const ctxAcc = container.querySelector('#chart-accumulated').getContext('2d');
    let currentSum = 0;
    const accData = data.dayDetails.map(d => {
        currentSum += d.value;
        return currentSum;
    });

    new Chart(ctxAcc, {
        type: 'line',
        data: {
            labels: data.dayDetails.map(d => format(d.date, 'dd')),
            datasets: [{
                label: 'Total Acumulado (R$)',
                data: accData,
                borderColor: brandCyan,
                backgroundColor: 'rgba(31, 181, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}
