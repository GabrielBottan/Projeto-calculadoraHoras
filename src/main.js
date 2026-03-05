import './app.css';
import { createIcons, Download, PieChart, Calendar, Target, DollarSign, Clock } from 'lucide';
import { PJCalculator } from './logic/calculator';
import { getHolidays } from './services/holidayService';
import { renderGainTab } from './components/tabs/gain';
import { renderMetaTab } from './components/tabs/meta';
import { renderCalendarTab } from './components/tabs/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Initialize state
const calc = new PJCalculator();
let activeTab = 'gain';

// DOM Elements
const tabs = {
    gain: document.getElementById('tab-gain'),
    meta: document.getElementById('tab-meta'),
    calendar: document.getElementById('tab-calendar')
};

const contents = {
    gain: document.getElementById('content-gain'),
    meta: document.getElementById('content-meta'),
    calendar: document.getElementById('content-calendar')
};

// Summary Elements
const summary = {
    month: document.getElementById('current-month-display'),
    totalDays: document.getElementById('total-days-display'),
    totalHours: document.getElementById('total-hours-display'),
    totalValue: document.getElementById('total-value-display'),
    mobileTotal: document.getElementById('mobile-total-display'),
    mobileHours: document.getElementById('mobile-hours-display')
};

async function init() {
    // Load initial data
    const year = calc.currentDate.getFullYear();
    const holidays = await getHolidays(year);
    calc.setHolidays(holidays);

    // Load persistence
    loadFromStorage();

    // Setup Event Listeners
    setupEventListeners();

    // Initial Render
    renderActiveTab();
    updateUI();

    // Lucide Icons
    createIcons({
        icons: { Download, PieChart, Calendar, Target, DollarSign, Clock }
    });
}

function setupEventListeners() {
    // Tab Switching
    Object.keys(tabs).forEach(tabId => {
        tabs[tabId].addEventListener('click', () => {
            switchTab(tabId);
        });
    });

    // Export Button
    document.getElementById('export-summary').addEventListener('click', exportToCSV);

    // Global events (e.g., input changes) will be delegated or handled in components
    window.addEventListener('pj-calc-update', () => {
        updateUI();
        saveToStorage();
    });
}

function switchTab(tabId) {
    activeTab = tabId;

    // Update Tab buttons
    Object.keys(tabs).forEach(id => {
        if (id === tabId) {
            tabs[id].classList.replace('tab-inactive', 'tab-active');
            contents[id].classList.remove('hidden');
        } else {
            tabs[id].classList.replace('tab-active', 'tab-inactive');
            contents[id].classList.add('hidden');
        }
    });

    renderActiveTab();
    updateUI();
}

function updateUI() {
    // Update Summary based on current mode
    const data = activeTab === 'meta' ? calc.calculateModeB(calc.meta) : calc.calculateModeA();

    // Update Sidebar Summary
    summary.month.textContent = format(calc.currentDate, 'MMMM yyyy', { locale: ptBR });
    summary.totalDays.textContent = data.workDaysCount || data.totalDays || 0;
    summary.totalHours.textContent = `${(data.totalHours || data.totalHoursNeeded || 0).toFixed(1)}h`;

    const totalR$ = data.totalValue || calc.meta || 0;
    summary.totalValue.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalR$);

    // Mobile Summary
    summary.mobileTotal.textContent = summary.totalValue.textContent;
    summary.mobileHours.textContent = summary.totalHours.textContent;

    // (renderActiveTab was removed from here to prevent focus loss)
}

function renderActiveTab() {
    const container = contents[activeTab];

    switch (activeTab) {
        case 'gain':
            renderGainTab(container, calc);
            break;
        case 'meta':
            renderMetaTab(container, calc);
            break;
        case 'calendar':
            renderCalendarTab(container, calc);
            break;
    }
}

function saveToStorage() {
    const data = {
        valorHora: calc.valorHora,
        baseHoursPerDay: calc.baseHoursPerDay,
        workDays: calc.workDays,
        includeWeekends: calc.includeWeekends,
        includeHolidays: calc.includeHolidays,
        overrides: Array.from(calc.overrides.entries()),
        meta: calc.meta
    };
    localStorage.setItem('pj_calc_settings', JSON.stringify(data));
}

function loadFromStorage() {
    const saved = localStorage.getItem('pj_calc_settings');
    if (saved) {
        const data = JSON.parse(saved);
        calc.valorHora = data.valorHora || 0;
        calc.baseHoursPerDay = data.baseHoursPerDay || 8;
        calc.workDays = data.workDays || [1, 2, 3, 4, 5];
        calc.includeWeekends = data.includeWeekends || false;
        calc.includeHolidays = data.includeHolidays || false;
        calc.overrides = new Map(data.overrides || []);
        calc.meta = data.meta || 0;
    }
}

function exportToCSV() {
    const data = calc.calculateModeA();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Tipo,Horas,Valor (R$)\n";

    data.dayDetails.forEach(day => {
        csvContent += `${format(day.date, 'dd/MM/yyyy')},${day.type},${day.hours},${day.value}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resumo_pj_${format(calc.currentDate, 'yyyy_MM')}.csv`);
    document.body.appendChild(link);
    link.click();
}

init();
