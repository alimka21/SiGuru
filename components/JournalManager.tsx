
import React from 'react';
import { JournalEntry, LearningObjective, ScheduleItem, ClassInfo } from '../types';
import { useJournalLogic } from '../hooks/useJournalLogic';

interface Props {
  journals: JournalEntry[];
  onUpdateJournals: (journals: JournalEntry[]) => void;
  tps: LearningObjective[];
  schedules: ScheduleItem[];
  classes: ClassInfo[];
  initialContext?: { className?: string, scheduleId?: string };
  onBack: () => void;
}

export const JournalManager: React.FC<Props> = (props) => {
  // Call Hook
  const {
    state,
    setters,
    computed,
    handlers
  } = useJournalLogic(props);

  const { isModalOpen, editingId, filterClass, filterSubject, searchQuery, formData } = state;
  const { availableClasses, availableSubjects, filteredJournals, availableLMs } = computed;

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
       {/* Breadcrumbs */}
       <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-500">
        <a onClick={props.onBack} className="hover:text-primary cursor-pointer">Dashboard</a>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-slate-900 font-bold">Jurnal Guru</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Jurnal Mengajar</h2>
          <p className="text-slate-500 text-base font-normal">Catat aktivitas pembelajaran, refleksi, dan tindak lanjut harian.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handlers.handleExportExcel}
                disabled={filteredJournals.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="material-symbols-outlined text-sm">table_view</span>
                Export Excel
            </button>
            <button 
                onClick={() => setters.setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
            >
                <span className="material-symbols-outlined text-sm">edit_square</span>
                Isi Jurnal Baru
            </button>
        </div>
      </div>

      {/* FILTER BAR (REQUIRED) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-6 items-end">
         <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Class Filter */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Pilih Kelas</label>
                <div className="relative">
                    <select 
                        value={filterClass} 
                        onChange={(e) => setters.setFilterClass(e.target.value)}
                        className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary pl-10 appearance-none bg-slate-50"
                    >
                        <option value="">-- Semua Kelas --</option>
                        {availableClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">school</span>
                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
             </div>
             
             {/* Subject Filter */}
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Pilih Mata Pelajaran</label>
                <div className="relative">
                    <select 
                        value={filterSubject} 
                        onChange={(e) => setters.setFilterSubject(e.target.value)}
                        className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary focus:border-primary pl-10 appearance-none bg-slate-50"
                    >
                        <option value="">-- Semua Mapel --</option>
                        {availableSubjects.map(subj => (
                            <option key={subj} value={subj}>{subj}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 pointer-events-none text-lg">book</span>
                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
             </div>
         </div>

         {/* Search Filter (Auxiliary) */}
         <div className="w-full md:w-auto">
             <div className="relative">
                 <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                 <input 
                    type="text" 
                    placeholder="Cari topik kegiatan..." 
                    value={searchQuery}
                    onChange={(e) => setters.setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 w-full md:w-64 focus:ring-2 focus:ring-primary outline-none" 
                 />
             </div>
         </div>
      </div>

      {/* Main Content: List or Empty State */}
      <div className="space-y-4">
          {/* Validation: Check if filters are selected */}
          {!filterClass || !filterSubject ? (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">filter_alt</span>
                  <h3 className="text-lg font-bold text-slate-600">Filter Diperlukan</h3>
                  <p className="text-sm text-center max-w-md mt-1">
                      Silahkan pilih <strong>Kelas</strong> dan <strong>Mata Pelajaran</strong> di atas untuk menampilkan riwayat jurnal.
                  </p>
              </div>
          ) : (
              <>
                {/* Stats Bar if filtered */}
                <div className="flex justify-between items-center px-2">
                    <p className="text-sm font-bold text-slate-500">
                        Menampilkan riwayat untuk <span className="text-primary">{filterSubject}</span> di <span className="text-primary">{filterClass}</span>
                    </p>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                        {filteredJournals.length} Catatan
                    </span>
                </div>

                {filteredJournals.length > 0 ? (
                    filteredJournals.map(journal => {
                        const tp = props.tps.find(t => t.id === journal.tpId);
                        const lm = tp?.lms.find(l => l.id === journal.lmId);
                        
                        return (
                            <div key={journal.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-center min-w-[80px]">
                                            <p className="text-xs font-bold uppercase">{new Date(journal.date).toLocaleDateString('id-ID', { month: 'short' })}</p>
                                            <p className="text-2xl font-black">{new Date(journal.date).getDate()}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{journal.activity}</h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1 font-bold text-slate-700">
                                                    <span className="material-symbols-outlined text-sm">book</span> {journal.subjectName || 'Mapel Umum'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">schedule</span> {journal.startTime} - {journal.endTime}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">school</span> {journal.className}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handlers.handleEdit(journal)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><span className="material-symbols-outlined">edit</span></button>
                                        <button onClick={() => handlers.handleDelete(journal.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined">delete</span></button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-2 mb-4 border border-slate-100">
                                    <p className="flex gap-2">
                                        <span className="font-bold text-slate-700 w-24 shrink-0">TP:</span>
                                        <span className="text-slate-600">{tp?.code} - {tp?.description}</span>
                                    </p>
                                    {lm && (
                                        <p className="flex gap-2">
                                            <span className="font-bold text-slate-700 w-24 shrink-0">Materi (LM):</span>
                                            <span className="text-slate-600">{lm.title}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Refleksi</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">{journal.reflection || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Tindak Lanjut</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">{journal.followUp || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">auto_stories</span>
                        <p className="text-sm font-medium">Belum ada jurnal untuk filter ini.</p>
                        <button onClick={() => setters.setIsModalOpen(true)} className="mt-2 text-primary font-bold hover:underline text-sm">Buat Jurnal Baru</button>
                    </div>
                )}
              </>
          )}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-8">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0">
                      <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Jurnal' : 'Tambah Jurnal Baru'}</h3>
                      <button onClick={handlers.closeModal} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  
                  <form onSubmit={handlers.handleSave} className="p-6 space-y-6">
                       {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Tanggal</label>
                              <input 
                                type="date" required 
                                className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary"
                                value={formData.date}
                                onChange={e => setters.setFormData({...formData, date: e.target.value})}
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Jadwal / Jam Mengajar <span className="text-red-500">*</span></label>
                              <select 
                                required
                                className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary"
                                value={formData.scheduleId}
                                onChange={e => handlers.handleScheduleChange(e.target.value)}
                              >
                                  <option value="">-- Pilih Jadwal (Wajib) --</option>
                                  {props.schedules.map(s => (
                                      <option key={s.id} value={s.id}>{s.day} {s.startTime}-{s.endTime} | {s.className} | {s.subject}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Mata Pelajaran <span className="text-slate-400">(Otomatis)</span></label>
                                <input 
                                    type="text" readOnly
                                    className="w-full rounded-lg border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 cursor-not-allowed focus:ring-0"
                                    value={formData.subjectName}
                                    placeholder="Pilih jadwal dulu..."
                                />
                          </div>
                          <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Kelas <span className="text-slate-400">(Otomatis)</span></label>
                                <input 
                                    type="text" readOnly
                                    className="w-full rounded-lg border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 cursor-not-allowed focus:ring-0"
                                    value={formData.className}
                                    placeholder="Pilih jadwal dulu..."
                                />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Jam Mulai</label>
                              <input type="time" readOnly className="w-full rounded-lg border-slate-200 bg-slate-100 text-sm font-bold text-slate-700" value={formData.startTime} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Jam Selesai</label>
                              <input type="time" readOnly className="w-full rounded-lg border-slate-200 bg-slate-100 text-sm font-bold text-slate-700" value={formData.endTime} />
                          </div>
                      </div>

                      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4">
                          <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Tujuan Pembelajaran (TP) <span className="text-red-500">*</span></label>
                                <select 
                                    required
                                    className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary"
                                    value={formData.tpId}
                                    onChange={e => setters.setFormData({...formData, tpId: e.target.value, lmId: ''})}
                                >
                                    <option value="">-- Pilih TP --</option>
                                    {props.tps.map(tp => (
                                        <option key={tp.id} value={tp.id}>{tp.code} - {tp.description}</option>
                                    ))}
                                </select>
                          </div>
                          <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Lingkup Materi (LM)</label>
                                <select 
                                    className="w-full rounded-lg border-slate-200 text-sm font-bold text-slate-900 focus:ring-primary"
                                    value={formData.lmId}
                                    onChange={e => setters.setFormData({...formData, lmId: e.target.value})}
                                    disabled={!formData.tpId}
                                >
                                    <option value="">-- Pilih Materi (Opsional) --</option>
                                    {availableLMs.map(lm => (
                                        <option key={lm.id} value={lm.id}>{lm.code} - {lm.title}</option>
                                    ))}
                                </select>
                          </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Detail Kegiatan Pembelajaran <span className="text-red-500">*</span></label>
                          <textarea 
                             required rows={3}
                             className="w-full rounded-lg border-slate-200 text-sm text-slate-900 focus:ring-primary"
                             placeholder="Deskripsikan aktivitas yang dilakukan..."
                             value={formData.activity}
                             onChange={e => setters.setFormData({...formData, activity: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Refleksi Guru</label>
                              <textarea 
                                rows={3}
                                className="w-full rounded-lg border-slate-200 text-sm text-slate-900 focus:ring-primary"
                                placeholder="Apa yang berhasil? Apa yang perlu diperbaiki?"
                                value={formData.reflection}
                                onChange={e => setters.setFormData({...formData, reflection: e.target.value})}
                                />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase">Tindak Lanjut</label>
                              <textarea 
                                rows={3}
                                className="w-full rounded-lg border-slate-200 text-sm text-slate-900 focus:ring-primary"
                                placeholder="Rencana pertemuan selanjutnya..."
                                value={formData.followUp}
                                onChange={e => setters.setFormData({...formData, followUp: e.target.value})}
                                />
                          </div>
                      </div>

                      <div className="pt-4 flex gap-3 border-t border-slate-100">
                          <button type="button" onClick={handlers.closeModal} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Batal</button>
                          <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-200">Simpan Jurnal</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};
