import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

// Interfaces atualizadas para incluir controle financeiro
interface ItineraryItem {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  location: { lat: number; lng: number; address: string };
  completed: boolean;
  rating: number;
  comment: string;
  category: 'food' | 'culture' | 'hotel' | 'shopping' | 'park';
  spent: number; // Campo para valor gasto
  transportTip?: string;
}

interface DiscoveryPoint {
  id: string;
  title: string;
  description: string;
  category: string;
  lat: number; lng: number;
  address: string;
}

interface Tip {
  title: string;
  content: string;
  icon: string;
}

declare var L: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden select-none">
      
      <!-- Status Bar Simulator -->
      <div class="h-6 bg-white w-full"></div>

      <!-- Header -->
      <header class="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm z-50">
        <div class="flex items-center gap-3">
          <div class="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-xl shadow-lg shadow-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-black text-slate-800 leading-none">SP com Amor</h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão de Viagem</p>
          </div>
        </div>
        <button (click)="view.set('add')" class="bg-slate-100 text-slate-600 p-2.5 rounded-full active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto pb-32 px-4 pt-4 relative">
        
        <!-- VIEW: CARDS (ITINERARY) -->
        @if (view() === 'Cards') {
          <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            @for (date of uniqueDates(); track date) {
              <div class="space-y-4">
                <div class="sticky top-0 z-10 py-2 bg-slate-50/95 backdrop-blur-sm">
                  <h2 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ formatDateLabel(date) }}</h2>
                </div>
                
                @for (item of getItemsByDate(date); track item.id) {
                  <div class="group relative bg-white rounded-3xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-all">
                    <div class="absolute right-4 top-5">
                       <div [class]="item.completed ? 'bg-green-500' : 'bg-amber-400'" class="h-2 w-2 rounded-full shadow-sm"></div>
                    </div>

                    <div class="flex gap-4">
                      <div class="text-center min-w-[40px]">
                        <span class="block text-lg font-black text-slate-800 leading-none">{{ item.time }}</span>
                        <div class="h-full w-px bg-slate-100 mx-auto mt-2 min-h-[40px]"></div>
                      </div>
                      <div class="flex-1">
                        <h3 class="text-base font-bold text-slate-800 leading-tight">{{ item.title }}</h3>
                        <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ item.description }}</p>
                        
                        <div class="mt-4 space-y-3">
                          <!-- Spending Input -->
                          <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span class="text-[10px] font-black text-slate-400 uppercase ml-2">Gasto (R$)</span>
                            <input type="number" 
                                   [(ngModel)]="item.spent" 
                                   (blur)="saveToStorage()"
                                   placeholder="0,00" 
                                   class="flex-1 bg-transparent text-sm font-black text-slate-700 outline-none text-right pr-2">
                          </div>

                          <!-- Action Buttons -->
                          <div class="flex gap-2">
                            <button (click)="toggleComplete(item.id)" 
                                    [class]="item.completed ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'"
                                    class="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors">
                              {{ item.completed ? '✓ Concluído' : 'Check-in' }}
                            </button>
                            
                            <button (click)="showOnMap(item)" 
                                    class="bg-red-50 text-red-600 p-2.5 rounded-xl border border-red-100">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                            </button>

                            <button (click)="openDetail(item)" 
                                    class="bg-slate-900 text-white p-2.5 rounded-xl">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- VIEW: BUDGET (FINANCES) -->
        @if (view() === 'Budget') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <!-- Total Card -->
            <div class="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
               <div class="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl"></div>
               <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Gasto Total Acumulado</p>
               <h2 class="text-4xl font-black mt-2 tracking-tighter">R$ {{ totalSpent() | number:'1.2-2' }}</h2>
               <div class="mt-6 flex items-center gap-2">
                 <div class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[9px] font-bold border border-green-500/30">
                    ORÇAMENTO VIAGEM
                 </div>
               </div>
            </div>

            <!-- Spending Bar Chart -->
            <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Gastos Diários</h3>
               
               <div class="flex items-end justify-between h-48 gap-3 px-2">
                  @for (day of dailyStats(); track day.date) {
                    <div class="flex-1 flex flex-col items-center gap-3">
                       <div class="relative w-full flex justify-center items-end h-full">
                          <!-- Value Tooltip -->
                          <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-md transition-opacity whitespace-nowrap">
                            R$ {{ day.total | number:'1.0-0' }}
                          </div>
                          <!-- Bar element -->
                          <div [style.height.%]="day.percent" 
                               class="w-full max-w-[30px] bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg shadow-lg shadow-red-100 transition-all duration-1000">
                          </div>
                       </div>
                       <span class="text-[9px] font-black text-slate-400 uppercase">{{ day.label }}</span>
                    </div>
                  }
               </div>
            </div>

            <!-- Statistics Summary -->
            <div class="grid grid-cols-2 gap-3">
               <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Média por Dia</p>
                  <p class="text-lg font-black text-slate-800 mt-1">R$ {{ (totalSpent() / (uniqueDates().length || 1)) | number:'1.2-2' }}</p>
               </div>
               <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atividades Pagas</p>
                  <p class="text-lg font-black text-slate-800 mt-1">{{ paidCount() }} / {{ items().length }}</p>
               </div>
            </div>
          </div>
        }

        <!-- Other views (Timeline, Mapa, Dicas, Add) maintained same structure -->
        @if (view() === 'Timeline') {
          <div class="animate-in fade-in slide-in-from-right-4 px-4">
            <div class="relative pl-8 pr-2">
              <div class="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
              @for (item of items(); track item.id) {
                <div class="relative mb-12 last:mb-0">
                  <div class="absolute -left-6 top-1 h-4 w-4 rounded-full border-4 border-white shadow-md transition-colors"
                       [class]="item.completed ? 'bg-green-500' : 'bg-red-500'"></div>
                  <div class="flex flex-col">
                    <span class="text-[10px] font-black text-red-500 uppercase tracking-widest">{{ item.date | date:'dd MMM' }} • {{ item.time }}</span>
                    <span class="text-base font-bold text-slate-800 mt-1">{{ item.title }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (view() === 'Mapa') {
          <div class="h-full flex flex-col gap-4 animate-in zoom-in-95 duration-300">
            <div class="flex p-1 bg-slate-200/50 rounded-2xl">
               <button (click)="mapSubView.set('jornada')" 
                       [class]="mapSubView() === 'jornada' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                       class="flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all">Jornada</button>
               <button (click)="mapSubView.set('explorar')" 
                       [class]="mapSubView() === 'explorar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
                       class="flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all">Explorar SP</button>
            </div>
            <div class="relative flex-1 min-h-[400px] w-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl z-10 bg-slate-200">
               <div id="map-container" class="h-full w-full"></div>
            </div>
          </div>
        }

        @if (view() === 'Dicas') {
          <div class="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
             @for (tip of tips; track tip.title) {
               <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">{{ tip.icon }}</span>
                    <h3 class="font-black text-slate-800 uppercase text-xs tracking-wider">{{ tip.title }}</h3>
                  </div>
                  <p class="text-sm text-slate-600 leading-relaxed">{{ tip.content }}</p>
               </div>
             }
          </div>
        }

        @if (view() === 'add') {
          <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-full duration-500">
            <h2 class="text-2xl font-black mb-8 text-slate-800 tracking-tight">Novo Destino</h2>
            <form [formGroup]="addForm" (ngSubmit)="addNewItem()" class="space-y-6">
               <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Onde vamos?</label>
                  <input type="text" formControlName="title" placeholder="Nome do local" class="w-full rounded-2xl bg-slate-50 border-none p-4 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none">
               </div>
               <div class="flex gap-4">
                  <div class="flex-1 space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                    <input type="date" formControlName="date" class="w-full rounded-2xl bg-slate-50 border-none p-4 text-xs font-bold outline-none">
                  </div>
                  <div class="flex-1 space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                    <input type="time" formControlName="time" class="w-full rounded-2xl bg-slate-50 border-none p-4 text-xs font-bold outline-none">
                  </div>
               </div>
               <div class="flex gap-4 pt-4">
                  <button type="button" (click)="view.set('Cards')" class="flex-1 py-4 font-black text-slate-400 uppercase text-[11px] tracking-widest">Voltar</button>
                  <button type="submit" [disabled]="!addForm.valid" class="flex-1 bg-red-600 text-white rounded-2xl py-4 font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">Confirmar</button>
               </div>
            </form>
          </div>
        }

      </main>

      <!-- Bottom Tab Bar -->
      <nav class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 pt-3 pb-8 flex justify-between items-center z-[100]">
        @for (nav of [
          {v:'Cards', i:'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z', l:'Roteiro'}, 
          {v:'Mapa', i:'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', l:'Explorar'},
          {v:'Budget', i:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', l:'Ganhos'},
          {v:'Dicas', i:'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', l:'Info'}
        ]; track nav.v) {
          <button (click)="view.set(nav.v)" 
                  [class]="view() === nav.v ? 'text-red-600 scale-110' : 'text-slate-300'" 
                  class="flex flex-col items-center flex-1 transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="nav.i" />
            </svg>
            <span class="text-[8px] font-black uppercase mt-1 tracking-tighter">{{ nav.l }}</span>
          </button>
        }
      </nav>

      <!-- Logistics Modal -->
      @if (selectedItem()) {
        <div class="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4" (click)="selectedItem.set(null)">
          <div class="w-full max-w-lg bg-white rounded-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500" (click)="$event.stopPropagation()">
            <div class="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <h2 class="text-2xl font-black text-slate-800 tracking-tight leading-none">{{ selectedItem()?.title }}</h2>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{{ selectedItem()?.date | date:'dd MMMM yyyy' }}</p>
            <div class="mt-8 space-y-4">
              <div class="bg-slate-50 p-6 rounded-3xl flex items-center justify-between border border-slate-100 shadow-inner">
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimativa UberX</p>
                  <p class="text-3xl font-black text-slate-900 mt-1">R$ {{ calculateUber(selectedItem()!) }}</p>
                </div>
                <div class="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-3xl">🚕</div>
              </div>
              <button (click)="openMap(selectedItem()!)" class="w-full bg-slate-900 text-white rounded-2xl p-5 font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                Abrir Rota no Google Maps
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; width: 100vw; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .animate-in { animation-duration: 0.3s; animation-fill-mode: both; }
    .fade-in { animation-name: fadeIn; }
    .slide-in-from-bottom-4 { animation-name: slideInBottom; }
    .slide-in-from-right-4 { animation-name: slideInRight; }
    .slide-in-from-left-4 { animation-name: slideInLeft; }
    .slide-in-from-bottom-full { animation-name: slideInBottomFull; }
    .zoom-in-95 { animation-name: zoomIn; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInBottom { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideInRight { from { transform: translateX(1rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideInLeft { from { transform: translateX(-1rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideInBottomFull { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class App implements OnInit {
  private fb = inject(FormBuilder);
  view = signal<string>('Cards');
  mapSubView = signal<'jornada' | 'explorar'>('jornada');
  items = signal<ItineraryItem[]>([]);
  selectedItem = signal<ItineraryItem | null>(null);
  pendingMapFocus = signal<ItineraryItem | null>(null);
  mapReady = false;
  private mapInstance: any;
  private markersGroup: any;
  private markersMap = new Map<string, any>();

  tips: Tip[] = [
    { title: 'Gestão Financeira', content: 'Insira os valores gastos logo após sair do local para manter o gráfico de ganhos sempre atualizado.', icon: '💰' },
    { title: 'Reservas', content: 'Para Sesc Paulista e Theatro Municipal, as vagas esgotam rápido. Tente agendar logo cedo pelo app Credencial Sesc.', icon: '📅' },
    { title: 'Transporte', content: 'Aproveitem as estações de metro próximas aos pontos históricos para economizar e ganhar tempo.', icon: '🚇' }
  ];

  // Cálculos de Orçamento
  totalSpent = computed(() => {
    return this.items().reduce((acc, curr) => acc + (curr.spent || 0), 0);
  });

  paidCount = computed(() => {
    return this.items().filter(i => i.spent > 0).length;
  });

  dailyStats = computed(() => {
    const dates = this.uniqueDates();
    const stats = dates.map(date => {
      const dayTotal = this.items()
        .filter(i => i.date === date)
        .reduce((acc, curr) => acc + (curr.spent || 0), 0);
      
      const d = new Date(date + 'T12:00:00');
      return {
        date,
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        total: dayTotal,
        percent: 0 // Will be set below
      };
    });

    const max = Math.max(...stats.map(s => s.total), 1);
    return stats.map(s => ({ ...s, percent: (s.total / max) * 100 }));
  });

  hotelLocation = { lat: -23.5583, lng: -46.6339 };

  constructor() {
    effect(() => {
      if (this.view() === 'Mapa') setTimeout(() => this.initMap(), 400);
      else this.destroyMap();
    });
    effect(() => {
      if (this.mapReady && this.view() === 'Mapa') {
        this.renderMarkers();
        this.checkPendingFocus();
      }
    });
  }

  ngOnInit() {
    this.loadLeaflet();
    const saved = localStorage.getItem('sp_roteiro');
    if (saved) this.items.set(JSON.parse(saved));
    else {
      this.items.set(this.getInitialItems());
      this.saveToStorage();
    }
  }

  private loadLeaflet() {
    if (document.getElementById('leaflet-css')) return;
    const css = document.createElement('link');
    css.id = 'leaflet-css'; css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => console.log('Leaflet Pronto');
    document.head.appendChild(script);
  }

  private initMap() {
    if (typeof (window as any).L === 'undefined') { setTimeout(() => this.initMap(), 500); return; }
    const L = (window as any).L;
    if (!this.mapInstance) {
      this.mapInstance = L.map('map-container', { zoomControl: false }).setView([this.hotelLocation.lat, this.hotelLocation.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(this.mapInstance);
      this.markersGroup = L.layerGroup().addTo(this.mapInstance);
      this.mapReady = true;
    }
    this.renderMarkers();
  }

  private destroyMap() {
    if (this.mapInstance) { this.mapInstance.remove(); this.mapInstance = null; this.mapReady = false; }
  }

  showOnMap(item: ItineraryItem) {
    this.pendingMapFocus.set(item);
    this.mapSubView.set('jornada');
    this.view.set('Mapa');
  }

  private checkPendingFocus() {
    const focus = this.pendingMapFocus();
    if (focus && this.mapInstance) {
      setTimeout(() => {
        this.mapInstance.setView([focus.location.lat, focus.location.lng], 16);
        const m = this.markersMap.get(focus.id);
        if (m) m.openPopup();
        this.pendingMapFocus.set(null);
      }, 500);
    }
  }

  private renderMarkers() {
    if (!this.mapInstance || !this.markersGroup) return;
    const L = (window as any).L;
    this.markersGroup.clearLayers();
    this.markersMap.clear();

    if (this.mapSubView() === 'jornada') {
      this.items().forEach(item => {
        const marker = L.circleMarker([item.location.lat, item.location.lng], {
          radius: 9, fillColor: item.completed ? '#16a34a' : '#f59e0b', color: '#fff', weight: 3, fillOpacity: 1
        }).addTo(this.markersGroup).bindPopup(`<b class="text-xs">${item.title}</b>`);
        this.markersMap.set(item.id, marker);
      });
    }
  }

  uniqueDates = computed(() => [...new Set(this.items().map(i => i.date))].sort());
  getItemsByDate(date: string) { return this.items().filter(i => i.date === date).sort((a, b) => a.time.localeCompare(b.time)); }
  formatDateLabel(date: string) { return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }); }
  toggleComplete(id: string) { this.items.update(list => list.map(i => i.id === id ? { ...i, completed: !i.completed } : i)); this.saveToStorage(); }
  setRating(id: string, stars: number) { this.items.update(list => list.map(i => i.id === id ? { ...i, rating: stars } : i)); this.saveToStorage(); }
  saveToStorage() { localStorage.setItem('sp_roteiro', JSON.stringify(this.items())); }
  openDetail(item: ItineraryItem) { this.selectedItem.set(item); }
  calculateUber(item: ItineraryItem): string {
    const dist = Math.sqrt(Math.pow(item.location.lat - this.hotelLocation.lat, 2) + Math.pow(item.location.lng - this.hotelLocation.lng, 2)) * 111;
    return (9.90 + (dist * 3.8)).toFixed(2);
  }
  openGoogleMaps(item: ItineraryItem) { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location.address)}`, '_blank'); }

  addForm = this.fb.group({ title: ['', Validators.required], date: ['', Validators.required], time: ['', Validators.required], description: [''] });

  addNewItem() {
    if (this.addForm.valid) {
      const val = this.addForm.value;
      const newItem: ItineraryItem = {
        id: Math.random().toString(36).substr(2, 9),
        date: val.date!, time: val.time!, title: val.title!, description: val.description || '',
        location: { lat: -23.55, lng: -46.63, address: val.title! },
        completed: false, rating: 0, comment: '', category: 'culture', spent: 0
      };
      this.items.update(list => [...list, newItem]);
      this.saveToStorage();
      this.view.set('Cards');
      this.addForm.reset();
    }
  }

  private getInitialItems(): ItineraryItem[] {
    return [
      // QUARTA-FEIRA 22/04
      { id: '1', spent: 0, date: '2026-04-22', time: '06:00', title: 'Hotel Banri', description: 'Check-in e descanso inicial.', location: { lat: -23.5583, lng: -46.6339, address: 'R. Galvão Bueno, 209' }, completed: false, rating: 0, comment: '', category: 'hotel' },
      { id: '2', spent: 0, date: '2026-04-22', time: '09:00', title: '89 Coffee / We Coffee', description: 'Café da manhã instagramável.', location: { lat: -23.5585, lng: -46.6330, address: 'Liberdade' }, completed: false, rating: 0, comment: '', category: 'food' },
      { id: '3', spent: 0, date: '2026-04-22', time: '10:30', title: 'Jardim Oriental & Compras', description: 'Caminhada pela Galvão Bueno.', location: { lat: -23.5588, lng: -46.6340, address: 'Rua Galvão Bueno' }, completed: false, rating: 0, comment: '', category: 'shopping' },
      { id: '4', spent: 0, date: '2026-04-22', time: '12:00', title: 'Lamen Kazu', description: 'Almoço clássico japonês.', location: { lat: -23.5580, lng: -46.6335, address: 'R. Tomás Gonzaga, 51' }, completed: false, rating: 0, comment: '', category: 'food' },
      { id: '5', spent: 0, date: '2026-04-22', time: '14:30', title: 'Museu da Imigração Japonesa', description: 'Imersão cultural.', location: { lat: -23.5575, lng: -46.6355, address: 'Liberdade' }, completed: false, rating: 0, comment: '', category: 'culture' },
      { id: '6', spent: 0, date: '2026-04-22', time: '20:00', title: 'Izakaya Issa', description: 'Jantar intimista (Izakaya).', location: { lat: -23.5578, lng: -46.6330, address: 'Liberdade' }, completed: false, rating: 0, comment: '', category: 'food' },
      
      // QUINTA-FEIRA 23/04
      { id: '7', spent: 0, date: '2026-04-23', time: '10:00', title: 'Theatro Municipal', description: 'Visita guiada histórica.', location: { lat: -23.5461, lng: -46.6371, address: 'Centro' }, completed: false, rating: 0, comment: '', category: 'culture' },
      { id: '8', spent: 0, date: '2026-04-23', time: '11:30', title: 'Mosteiro de São Bento', description: 'Arquitetura e tranquilidade.', location: { lat: -23.5465, lng: -46.6345, address: 'Centro' }, completed: false, rating: 0, comment: '', category: 'culture' },
      { id: '9', spent: 0, date: '2026-04-23', time: '13:00', title: 'Restaurante Abarú', description: 'Almoço no Rooftop.', location: { lat: -23.5464, lng: -46.6375, address: 'Shopping Light' }, completed: false, rating: 0, comment: '', category: 'food' },
      { id: '10', spent: 0, date: '2026-04-23', time: '15:30', title: 'Farol Santander', description: 'Mirante clássico.', location: { lat: -23.5451, lng: -46.6341, address: 'Centro' }, completed: false, rating: 0, comment: '', category: 'culture' },
      { id: '11', spent: 0, date: '2026-04-23', time: '20:00', title: 'Bar dos Arcos', description: 'Drinks cinematográficos.', location: { lat: -23.5461, lng: -46.6371, address: 'Centro' }, completed: false, rating: 0, comment: '', category: 'food' },
      
      // SEXTA-FEIRA 24/04
      { id: '12', spent: 0, date: '2026-04-24', time: '10:00', title: 'Japan House & Casa das Rosas', description: 'Cultura na Paulista.', location: { lat: -23.5701, lng: -46.6461, address: 'Av. Paulista' }, completed: false, rating: 0, comment: '', category: 'culture' },
      { id: '13', spent: 0, date: '2026-04-24', time: '12:30', title: 'Sesc Paulista & Mirante', description: 'Vista incrível da Avenida.', location: { lat: -23.5707, lng: -46.6457, address: 'Av. Paulista' }, completed: false, rating: 0, comment: '', category: 'food' },
      { id: '14', spent: 0, date: '2026-04-24', time: '15:00', title: 'Conjunto Nacional', description: 'Livraria Cultura e passeio.', location: { lat: -23.5590, lng: -46.6610, address: 'Av. Paulista' }, completed: false, rating: 0, comment: '', category: 'shopping' },
      { id: '15', spent: 0, date: '2026-04-24', time: '18:30', title: 'MASP', description: 'Sextas Gratuitas (Arte).', location: { lat: -23.5614, lng: -46.6559, address: 'Av. Paulista' }, completed: false, rating: 0, comment: '', category: 'culture' },
      { id: '16', spent: 0, date: '2026-04-24', time: '21:00', title: 'Restaurante Pecatto', description: 'Jantar temático.', location: { lat: -23.5435, lng: -46.5620, address: 'Tatuapé' }, completed: false, rating: 0, comment: '', category: 'food' },
      
      // SÁBADO 25/04
      { id: '17', spent: 0, date: '2026-04-25', time: '10:00', title: 'Pinacoteca', description: 'Visita artística guiada.', location: { lat: -23.5350, lng: -46.6339, address: 'Luz' }, completed: false, rating: 0, comment: '', category: 'culture' },
      { id: '18', spent: 0, date: '2026-04-25', time: '12:30', title: 'Café da Pina', description: 'Almoço no Parque da Luz.', location: { lat: -23.5350, lng: -46.6339, address: 'Pinacoteca' }, completed: false, rating: 0, comment: '', category: 'food' },
      { id: '19', spent: 0, date: '2026-04-25', time: '15:00', title: 'Fábrica da Dengo', description: 'Experiência sensorial.', location: { lat: -23.5855, lng: -46.6817, address: 'Pinheiros' }, completed: false, rating: 0, comment: '', category: 'food' },
      { id: '20', spent: 0, date: '2026-04-25', time: '18:00', title: 'Praça Pôr do Sol', description: 'Pôr do sol na Vila Madalena.', location: { lat: -23.5539, lng: -46.7028, address: 'Alto de Pinheiros' }, completed: false, rating: 0, comment: '', category: 'park' },
      
      // DOMINGO 26/04
      { id: '21', spent: 0, date: '2026-04-26', time: '10:00', title: 'Museu da Língua Portuguesa', description: 'Gratuito aos domingos.', location: { lat: -23.5348, lng: -46.6340, address: 'Luz' }, completed: false, rating: 0, comment: '', category: 'culture' },
      { id: '22', spent: 0, date: '2026-04-26', time: '13:00', title: 'Feira da Liberdade', description: 'Almoço de despedida.', location: { lat: -23.5588, lng: -46.6341, address: 'Liberdade' }, completed: false, rating: 0, comment: '', category: 'food' },
      { id: '23', spent: 0, date: '2026-04-26', time: '15:00', title: 'Check-out Hotel', description: 'Saída para aeroporto.', location: { lat: -23.5583, lng: -46.6339, address: 'Hotel Banri' }, completed: false, rating: 0, comment: '', category: 'hotel' }
    ];
  }
}