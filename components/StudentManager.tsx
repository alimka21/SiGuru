
import React, { useState, useMemo, useRef } from 'react';
import ExcelJS from 'exceljs';
import { Student, ClassInfo } from '../types';

declare const Swal: any;

interface Props {
  students: Student[];
  classes: ClassInfo[];
  onUpdateStudents: (students: Student[]) => void;
  onUpdateClasses: (classes: ClassInfo[]) => void; // Added prop to update classes
  onBack: () => void;
}

// Helper for Title Case
const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

export const StudentManager: React.FC<Props> = ({ students, classes, onUpdateStudents, onUpdateClasses, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // FILTER STATE
  const [filterClass, setFilterClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Default Form Data
  const [formData, setFormData] = useState({
      name: '',
      nis: '',
      gender: 'L',
      className: '',
      status: 'Aktif'
  });

  // Filtered Students Calculation
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
        const matchesClass = filterClass ? student.className === filterClass : true;
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              student.nis.includes(searchQuery);
        return matchesClass && matchesSearch;
    });
  }, [students, filterClass, searchQuery]);

  const handleOpenModal = (student?: Student) => {
      if (student) {
          setEditingId(student.id);
          setFormData({
              name: student.name,
              nis: student.nis,
              gender: 'L', // Assuming L default if property missing in basic type
              className: student.className || '',
              status: 'Aktif'
          });
      } else {
          setEditingId(null);
          // Set default class if available
          const defaultClass = classes.length > 0 ? classes[0].name : '';
          setFormData({ name: '', nis: '', gender: 'L', className: defaultClass, status: 'Aktif' });
      }
      setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
      e.preventDefault();
      
      // VALIDATION: Check for empty fields
      if (!formData.name.trim() || !formData.nis.trim() || !formData.className || !formData.gender) {
          Swal.fire({
              title: 'Gagal Menyimpan',
              text: "Semua kolom (Nama, NIS, Jenis Kelamin, Kelas) wajib diisi!",
              icon: 'error',
              confirmButtonColor: '#d33',
              confirmButtonText: 'OK'
          });
          return;
      }

      // AUTO-CAPITALIZE NAME
      const formattedName = toTitleCase(formData.name);

      if (editingId) {
          // Update
          const updatedStudents = students.map(s => s.id === editingId ? { ...s, ...formData, name: formattedName } : s);
          onUpdateStudents(updatedStudents);
      } else {
          // Add
          const newStudent: Student = {
              id: Date.now().toString(),
              name: formattedName,
              nis: formData.nis,
              className: formData.className,
          };
          onUpdateStudents([newStudent, ...students]);
      }
      setIsModalOpen(false);
      
      // Success Feedback
      Swal.fire({
          title: 'Berhasil!',
          text: 'Data siswa telah disimpan.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
      });
  };

  const handleDeleteStudent = (id: string) => {
      Swal.fire({
          title: 'Hapus Siswa?',
          text: "Data ini tidak dapat dikembalikan!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Ya, hapus!',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateStudents(students.filter(s => s.id !== id));
              Swal.fire(
                  'Terhapus!',
                  'Data siswa berhasil dihapus.',
                  'success'
              )
          }
      });
  };

  // --- IMPORT / EXPORT LOGIC ---

  const handleImportMenuClick = () => {
      Swal.fire({
          title: 'Import Data Siswa',
          text: 'Silahkan unduh template terlebih dahulu, isi data, lalu upload kembali. Jika nama kelas di Excel belum ada di sistem, kelas baru akan otomatis dibuat.',
          icon: 'info',
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: 'Upload Data Excel',
          denyButtonText: 'Unduh Template',
          cancelButtonText: 'Batal',
          confirmButtonColor: '#137fec',
          denyButtonColor: '#28a745'
      }).then((result: any) => {
          if (result.isConfirmed) {
              // Trigger File Input
              if (fileInputRef.current) {
                  fileInputRef.current.value = ''; // Reset input
                  fileInputRef.current.click();
              }
          } else if (result.isDenied) {
              handleDownloadTemplate();
          }
      });
  };

  const handleDownloadTemplate = async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Template Siswa');

      // Define Headers
      sheet.columns = [
          { header: 'No', key: 'no', width: 5 },
          { header: 'Nama Lengkap', key: 'name', width: 30 },
          { header: 'NIS', key: 'nis', width: 15 },
          { header: 'Kelas', key: 'className', width: 15 },
          { header: 'L/P', key: 'gender', width: 10 },
      ];

      // Style Header
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } };

      // Add Dummy Data (Row 2) to guide user
      sheet.addRow([1, 'Contoh: Ahmad Dahlan', '12345', '10-A', 'L']);

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Template_Import_Siswa_SiGuru.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const workbook = new ExcelJS.Workbook();
      const reader = new FileReader();

      reader.onload = async (evt) => {
          const buffer = evt.target?.result as ArrayBuffer;
          if (!buffer) return;

          try {
              await workbook.xlsx.load(buffer);
              const worksheet = workbook.getWorksheet(1); // Get first sheet
              
              if (!worksheet) {
                  Swal.fire('Error', 'File Excel tidak valid atau kosong.', 'error');
                  return;
              }

              const newStudents: Student[] = [];
              const importedClassNames = new Set<string>();
              let successCount = 0;
              let failCount = 0;

              // Iterate starting from Row 2 (skip header)
              worksheet.eachRow((row, rowNumber) => {
                  if (rowNumber === 1) return; // Skip Header

                  // Extract Data
                  const name = row.getCell(2).text?.trim(); // Col B
                  const nis = row.getCell(3).text?.trim();  // Col C
                  let className = row.getCell(4).text?.trim(); // Col D
                  
                  // Validasi Kelengkapan (Kolom 2, 3, 4 Wajib)
                  if (name && nis && className) {
                      // Normalize Class Name
                      // className = className.toUpperCase(); // Optional: force uppercase? Better keep as is but safe check.

                      const student: Student = {
                          id: `imp-${Date.now()}-${rowNumber}`,
                          name: toTitleCase(name),
                          nis: nis,
                          className: className,
                      };
                      newStudents.push(student);
                      importedClassNames.add(className);
                      successCount++;
                  } else {
                      // Jika baris tidak kosong sepenuhnya tapi data tidak lengkap
                      if (name || nis || className) {
                        failCount++;
                      }
                  }
              });

              if (newStudents.length > 0) {
                  // --- AUTOMATIC CLASS CREATION LOGIC ---
                  const classesToCreate: ClassInfo[] = [];
                  const existingClassNames = new Set(classes.map(c => c.name.toLowerCase()));
                  
                  // Determine default level (heuristic: use existing first class level or default)
                  const defaultLevel = classes.length > 0 ? classes[0].level : 'Fase E';

                  importedClassNames.forEach(clsName => {
                      if (!existingClassNames.has(clsName.toLowerCase())) {
                          const newClass: ClassInfo = {
                              id: `auto-cls-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              name: clsName,
                              level: defaultLevel, // Defaulting to avoid error, user can edit later
                              studentCount: 0 // Will be calculated by UI
                          };
                          classesToCreate.push(newClass);
                          // Add to temporary set to prevent duplicates within this import session
                          existingClassNames.add(clsName.toLowerCase());
                      }
                  });

                  // 1. Update Classes if needed
                  if (classesToCreate.length > 0) {
                      onUpdateClasses([...classes, ...classesToCreate]);
                  }

                  // 2. Update Students
                  onUpdateStudents([...newStudents, ...students]); 
                  
                  // 3. Feedback
                  let message = `<p>Berhasil menyimpan <b>${successCount}</b> data siswa.</p>`;
                  
                  if (classesToCreate.length > 0) {
                      message += `<p class="text-blue-600 mt-2 text-sm bg-blue-50 p-2 rounded">
                        <span class="font-bold">Info:</span> ${classesToCreate.length} Kelas baru otomatis dibuat (${classesToCreate.map(c => c.name).join(', ')}).
                      </p>`;
                  }

                  if (failCount > 0) {
                      message += `<p class="text-red-500 mt-2 text-sm">Gagal: <b>${failCount}</b> baris dilewati (Data tidak lengkap).</p>`;
                  }

                  Swal.fire({
                      title: 'Import Selesai',
                      html: message,
                      icon: failCount > 0 ? 'warning' : 'success'
                  });
              } else {
                  Swal.fire('Info', 'Tidak ada data valid yang ditemukan untuk diimport.', 'info');
              }

          } catch (error) {
              console.error(error);
              Swal.fire('Error', 'Gagal membaca file. Pastikan format Excel (.xlsx) benar.', 'error');
          }
      };

      reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls"
          className="hidden"
      />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-slate-500 text-sm font-medium hover:text-primary">Beranda</button>
        <span className="text-slate-400 text-sm font-medium">/</span>
        <span className="text-primary text-sm font-bold">Master Data Siswa</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 text-3xl font-extrabold tracking-tight">Master Data Siswa</h2>
          <p className="text-slate-500 text-base font-normal">Kelola data induk siswa, mutasi, dan status akademik.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleImportMenuClick}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors text-slate-700"
           >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Import Excel
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Summary Stats - 4 Required Banners */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col gap-1">
            <div className="flex justify-between items-start">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Siswa</span>
                <span className="material-symbols-outlined text-blue-500 bg-blue-50 p-1.5 rounded-lg text-lg">groups</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{students.length}</p>
        </div>
        {/* Placeholder stats as we don't have full data model for gender/status in the root Student type yet */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col gap-1 opacity-60">
            <div className="flex justify-between items-start">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Siswa Aktif</span>
                <span className="material-symbols-outlined text-green-500 bg-green-50 p-1.5 rounded-lg text-lg">check_circle</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">-</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center bg-slate-50">
           <div className="flex gap-4 flex-1">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                    <input 
                        type="text" 
                        placeholder="Cari nama, NIS..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 w-64 focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400" 
                    />
                </div>
                
                {/* Select with Icon Dropdown */}
                <div className="relative">
                    <select 
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-primary cursor-pointer w-48"
                    >
                        <option value="">Semua Kelas</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
           </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identitas Siswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? filteredStudents.map((student, index) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-center text-sm text-slate-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                    <div className="flex gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">NIS: {student.nis}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{student.className || '-'}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border bg-green-50 text-green-600 border-green-100`}>
                      <span className="size-1.5 rounded-full bg-green-500"></span> 
                      Aktif
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(student)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDeleteStudent(student.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                          <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                          <p>
                              {filterClass ? `Tidak ada siswa di kelas ${filterClass}.` : 'Belum ada data siswa.'}
                          </p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">Menampilkan {filteredStudents.length} siswa</p>
        </div>
      </div>

       {/* Add/Edit Student Modal */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all scale-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              required
                              placeholder="Nama Siswa"
                              className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">NIS <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                required
                                placeholder="Nomor Induk"
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.nis}
                                onChange={(e) => setFormData({...formData, nis: e.target.value})}
                            />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Jenis Kelamin <span className="text-red-500">*</span></label>
                            <select 
                                required
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                            >
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Kelas <span className="text-red-500">*</span></label>
                            <select 
                                required
                                className="w-full rounded-lg border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold text-slate-900 bg-white"
                                value={formData.className}
                                onChange={(e) => setFormData({...formData, className: e.target.value})}
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                      </div>
                      
                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
                          >
                              Batal
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 shadow-md shadow-blue-200"
                          >
                              {editingId ? 'Update Siswa' : 'Simpan Siswa'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
