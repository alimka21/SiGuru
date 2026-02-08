
import React from 'react';
import { CalendarEvent, EventType } from '../types';
import { useCalendarLogic } from '../hooks/useCalendarLogic';

interface Props {
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
  onBack: () => void;
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const CalendarManager: React.FC<Props> = (props) => {
  const { state, computed, handlers } = useCalendarLogic(props);
  const { currentDate, isModalOpen, formData, selectedDate } = state;
  const { monthData, selectedDayEvents } = computed;

  const getEventTypeColor = (type: EventType) => {
      switch (type) {
          case 'HOLIDAY': return 'bg-red-100 text-red-700 border-red-200';
          case 'EXAM': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'MEETING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
  };

  const getEventDotColor = (type: EventType) => {
      switch (type) {
          case 'HOLIDAY': return 'bg-red-500';
          case 'EXAM': return 'bg-blue-500';
          case 'MEETING': return 'bg-yellow-500';
          default: return 'bg-slate-500';
      }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
       {/* Breadcrumbs */}
       <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500 shrink-0">
        <a onClick={props.onBack} className="hover:text-primary cursor-pointer">Dashboard</a>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-slate-900 font-bold">Kalender Pendidikan</span>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
          {/* LEFT: CALENDAR GRID */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex flex-col">
                      <h2 className="text-2xl font-extrabold text-slate-800">
                          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </h2>
                      <p className="text-slate-500 text-sm">Jadwal Agenda & Kegiatan Sekolah</p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => handlers.changeMonth(-1)} className="p-2 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                          <span className="material-symbols-outlined text-slate-600">chevron_left</span>
                      </button>
                      <button onClick={() => handlers.changeMonth(1)} className="p-2 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                          <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                      </button>
                  </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
                  {DAY_NAMES.map((day, idx) => (
                      <div key={day} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${idx === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                          {day}
                      </div>
                  ))}
              </div>

              {/* Calendar Grid */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-slate-100 gap-px border-b border-slate-200">
                  {monthData.map((date, index) => {
                      if (!date) return <div key={`empty-${index}`} className="bg-white/50"></div>;
                      
                      const dateStr = date.toISOString().split('T')[0];
                      const dayEvents = props.events.filter(e => e.date === dateStr);
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      const isWeekend = date.getDay() === 0;

                      return (
                          <div 
                            key={dateStr} 
                            onClick={() => handlers.handleDayClick(date)}
                            className={`bg-white relative p-2 cursor-pointer hover:bg-blue-50 transition-colors group flex flex-col items-start justify-between min-h-[80px]
                                ${selectedDate === dateStr ? 'ring-2 ring-inset ring-primary z-10' : ''}
                            `}
                          >
                              <span className={`
                                  text-sm font-bold size-7 flex items-center justify-center rounded-full
                                  ${isToday ? 'bg-primary text-white shadow-md' : isWeekend ? 'text-red-500' : 'text-slate-700'}
                              `}>
                                  {date.getDate()}
                              </span>
                              
                              <div className="w-full space-y-1 mt-1">
                                  {dayEvents.slice(0, 3).map(ev => (
                                      <div key={ev.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border-l-2 ${getEventTypeColor(ev.type)} border-l-current`}>
                                          {ev.title}
                                      </div>
                                  ))}
                                  {dayEvents.length > 3 && (
                                      <div className="text-[9px] text-slate-400 font-bold px-1">
                                          +{dayEvents.length - 3} lainnya
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* RIGHT: DETAIL & FORM (Modal-like behavior but side-panel) */}
          {isModalOpen && (
              <div className="w-[350px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col shrink-0 animate-in slide-in-from-right-4 duration-300">
                  <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center rounded-t-2xl">
                      <div>
                          <h3 className="font-bold text-slate-800">Detail Agenda</h3>
                          <p className="text-xs text-slate-500">
                              {new Date(selectedDate!).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                          </p>
                      </div>
                      <button onClick={handlers.closeModal} className="text-slate-400 hover:text-red-500">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      {/* Event List */}
                      <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agenda Terdaftar</h4>
                          {selectedDayEvents.length > 0 ? (
                              selectedDayEvents.map(ev => (
                                  <div key={ev.id} className="p-3 rounded-xl border border-slate-200 hover:shadow-md transition-shadow group relative bg-white">
                                      <button 
                                        onClick={() => handlers.handleDeleteEvent(ev.id)}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <span className="material-symbols-outlined text-sm">delete</span>
                                      </button>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className={`size-2 rounded-full ${getEventDotColor(ev.type)}`}></span>
                                          <span className="text-xs font-bold text-slate-500 uppercase">{ev.type}</span>
                                      </div>
                                      <h5 className="font-bold text-slate-800 text-sm leading-tight">{ev.title}</h5>
                                      {ev.description && <p className="text-xs text-slate-500 mt-1">{ev.description}</p>}
                                  </div>
                              ))
                          ) : (
                              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                  <p className="text-xs italic">Tidak ada agenda pada tanggal ini.</p>
                              </div>
                          )}
                      </div>

                      {/* Add Form */}
                      <div className="pt-6 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Tambah Agenda Baru</h4>
                          <form onSubmit={handlers.handleAddEvent} className="space-y-3">
                              <div>
                                  <input 
                                    type="text" placeholder="Judul Agenda..." required
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary font-bold text-slate-900 placeholder:text-slate-400"
                                    value={formData.title}
                                    onChange={e => handlers.setFormData({...formData, title: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-2">
                                  <select 
                                    className="w-full text-xs border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-slate-900 font-bold"
                                    value={formData.type}
                                    onChange={e => handlers.setFormData({...formData, type: e.target.value as EventType})}
                                  >
                                      <option value="MEETING">Rapat</option>
                                      <option value="EXAM">Ujian/Asesmen</option>
                                      <option value="HOLIDAY">Libur</option>
                                      <option value="OTHER">Lainnya</option>
                                  </select>
                                  
                                  {/* CONDITIONAL INPUT FOR 'OTHER' */}
                                  {formData.type === 'OTHER' && (
                                      <input 
                                        type="text" 
                                        placeholder="Tuliskan jenis kegiatan..."
                                        className="w-full text-xs border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-slate-900 font-bold bg-slate-50 animate-in slide-in-from-top-1"
                                        value={formData.customNote || ''}
                                        onChange={e => handlers.setFormData({...formData, customNote: e.target.value})}
                                      />
                                  )}

                                  <input 
                                    type="text" placeholder="Deskripsi (Opsional)"
                                    className="w-full text-xs border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-slate-900 placeholder:text-slate-400"
                                    value={formData.description}
                                    onChange={e => handlers.setFormData({...formData, description: e.target.value})}
                                  />
                              </div>
                              <button type="submit" className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm">
                                  Simpan Agenda
                              </button>
                          </form>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
