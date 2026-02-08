
import { useState, useMemo, useRef } from 'react';
import ExcelJS from 'exceljs';
import { Student, ClassInfo, IdentityData } from '../types';

declare const Swal: any;

// Helper
const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

interface UseStudentLogicProps {
  identity: IdentityData;
  students: Student[];
  classes: ClassInfo[];
  onUpdateStudents: (students: Student[]) => void;
  onUpdateClasses: (classes: ClassInfo[]) => void;
}

export const useStudentLogic = ({
  identity,
  students,
  classes,
  onUpdateStudents,
  onUpdateClasses
}: UseStudentLogicProps) => {
  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // FILTER STATE
  const [filterClass, setFilterClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // SELECTION STATE
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Default Form Data
  const [formData, setFormData] = useState({
      name: '',
      nis: '',
      nisn: '', // Added NISN
      gender: 'L',
      className: '',
      status: 'Aktif'
  });

  // --- COMPUTED ---
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
        const matchesClass = filterClass ? student.className === filterClass : true;
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              student.nis.includes(searchQuery);
        return matchesClass && matchesSearch;
    });
  }, [students, filterClass, searchQuery]);

  // --- HANDLERS ---

  // SELECTION HANDLERS
  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const toggleAll = (selectAll: boolean) => {
      if (selectAll) {
          const allIds = filteredStudents.map(s => s.id);
          setSelectedIds(new Set(allIds));
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleDeleteSelected = () => {
      if (selectedIds.size === 0) return;

      Swal.fire({
          title: `Hapus ${selectedIds.size} Siswa?`,
          text: "Data yang dihapus tidak dapat dikembalikan!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Ya, Hapus'
      }).then((result: any) => {
          if (result.isConfirmed) {
              const newStudents = students.filter(s => !selectedIds.has(s.id));
              onUpdateStudents(newStudents);
              setSelectedIds(new Set());
              Swal.fire('Terhapus!', 'Data terpilih berhasil dihapus.', 'success');
          }
      });
  };

  const handleDeleteAll = () => {
      Swal.fire({
          title: 'HAPUS SEMUA DATA SISWA?',
          text: "PERINGATAN: Seluruh data siswa akan hilang permanen. Pastikan Anda sudah backup/export data jika diperlukan.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Ya, Kosongkan Data',
          cancelButtonText: 'Batal'
      }).then((result: any) => {
          if (result.isConfirmed) {
              onUpdateStudents([]);
              setSelectedIds(new Set());
              Swal.fire('Reset!', 'Database siswa telah dikosongkan.', 'success');
          }
      });
  };

  const handleOpenModal = (student?: Student) => {
      if (student) {
          setEditingId(student.id);
          setFormData({
              name: student.name,
              nis: student.nis,
              nisn: student.nisn || '',
              gender: 'L',
              className: student.className || '',
              status: 'Aktif'
          });
          setIsModalOpen(true);
      } else {
          // VALIDATION
          if (classes.length === 0) {
              Swal.fire({
                  title: 'Data Kelas Kosong',
                  text: 'Anda belum memiliki data Kelas. Silahkan buat Kelas terlebih dahulu di menu "Master Kelas" sebelum menambahkan siswa.',
                  icon: 'warning',
                  confirmButtonText: 'Oke, Mengerti',
                  confirmButtonColor: '#137fec'
              });
              return;
          }

          setEditingId(null);
          const defaultClass = classes.length > 0 ? classes[0].name : '';
          setFormData({ name: '', nis: '', nisn: '', gender: 'L', className: defaultClass, status: 'Aktif' });
          setIsModalOpen(true);
      }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name.trim() || !formData.nis.trim() || !formData.className || !formData.gender) {
          Swal.fire({
              title: 'Gagal Menyimpan',
              text: "Semua kolom wajib (Nama, NIS, Kelas, L/P) harus diisi!",
              icon: 'error',
              confirmButtonColor: '#d33',
              confirmButtonText: 'OK'
          });
          return;
      }

      const formattedName = toTitleCase(formData.name);

      if (editingId) {
          const updatedStudents = students.map(s => s.id === editingId ? { ...s, ...formData, name: formattedName } : s);
          onUpdateStudents(updatedStudents);
      } else {
          const newStudent: Student = {
              id: Date.now().toString(),
              name: formattedName,
              nis: formData.nis,
              nisn: formData.nisn, // Include NISN
              className: formData.className,
          };
          onUpdateStudents([newStudent, ...students]);
      }
      setIsModalOpen(false);
      
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
              Swal.fire('Terhapus!', 'Data siswa berhasil dihapus.', 'success')
          }
      });
  };

  // --- IMPORT LOGIC ---

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
              if (fileInputRef.current) {
                  fileInputRef.current.value = ''; 
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

      sheet.columns = [
          { header: 'No', key: 'no', width: 5 },
          { header: 'Nama Lengkap', key: 'name', width: 30 },
          { header: 'NIS', key: 'nis', width: 15 },
          { header: 'NISN', key: 'nisn', width: 15 }, // Added NISN Column
          { header: 'Kelas', key: 'className', width: 15 },
          { header: 'L/P', key: 'gender', width: 10 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137FEC' } };

      sheet.addRow([1, 'Contoh: Ahmad Dahlan', '12345', '0012345678', '10-A', 'L']);

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
              const worksheet = workbook.getWorksheet(1); 
              
              if (!worksheet) {
                  Swal.fire('Error', 'File Excel tidak valid atau kosong.', 'error');
                  return;
              }

              const newStudents: Student[] = [];
              const importedClassNames = new Set<string>();
              let successCount = 0;
              let failCount = 0;

              worksheet.eachRow((row, rowNumber) => {
                  if (rowNumber === 1) return;

                  const name = row.getCell(2).text?.trim(); 
                  const nis = row.getCell(3).text?.trim();  
                  const nisn = row.getCell(4).text?.trim(); // Read NISN
                  let className = row.getCell(5).text?.trim(); 
                  const genderRaw = row.getCell(6).text?.trim().toUpperCase();
                  const gender = genderRaw === 'P' ? 'P' : 'L';
                  
                  if (name && nis && className) {
                      const student: Student = {
                          id: `imp-${Date.now()}-${rowNumber}`,
                          name: toTitleCase(name),
                          nis: nis,
                          nisn: nisn,
                          className: className,
                          // gender would ideally be in Student type too if used for import logic, 
                          // but sticking to displayed props for now.
                      };
                      newStudents.push(student);
                      importedClassNames.add(className);
                      successCount++;
                  } else {
                      if (name || nis || className) failCount++;
                  }
              });

              if (newStudents.length > 0) {
                  const classesToCreate: ClassInfo[] = [];
                  const existingClassNames = new Set(classes.map(c => c.name.toLowerCase()));
                  const defaultLevel = classes.length > 0 ? classes[0].level : 'Fase E';

                  importedClassNames.forEach(clsName => {
                      if (!existingClassNames.has(clsName.toLowerCase())) {
                          const newClass: ClassInfo = {
                              id: `auto-cls-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              name: clsName,
                              level: defaultLevel,
                              studentCount: 0
                          };
                          classesToCreate.push(newClass);
                          existingClassNames.add(clsName.toLowerCase());
                      }
                  });

                  if (classesToCreate.length > 0) {
                      onUpdateClasses([...classes, ...classesToCreate]);
                  }

                  onUpdateStudents([...newStudents, ...students]); 
                  
                  let message = `<p>Berhasil menyimpan <b>${successCount}</b> data siswa.</p>`;
                  if (classesToCreate.length > 0) {
                      message += `<p class="text-blue-600 mt-2 text-sm bg-blue-50 p-2 rounded"><span class="font-bold">Info:</span> ${classesToCreate.length} Kelas baru otomatis dibuat.</p>`;
                  }
                  if (failCount > 0) {
                      message += `<p class="text-red-500 mt-2 text-sm">Gagal: <b>${failCount}</b> baris dilewati.</p>`;
                  }

                  Swal.fire({
                      title: 'Import Selesai',
                      html: message,
                      icon: failCount > 0 ? 'warning' : 'success'
                  });
              } else {
                  Swal.fire('Info', 'Tidak ada data valid yang ditemukan.', 'info');
              }

          } catch (error) {
              console.error(error);
              Swal.fire('Error', 'Gagal membaca file. Pastikan format Excel (.xlsx) benar.', 'error');
          }
      };

      reader.readAsArrayBuffer(file);
  };

  return {
    state: { isModalOpen, editingId, filterClass, searchQuery, formData, selectedIds },
    setters: { setIsModalOpen, setFilterClass, setSearchQuery, setFormData },
    computed: { filteredStudents },
    handlers: { 
        handleOpenModal, 
        handleSaveStudent, 
        handleDeleteStudent, 
        handleImportMenuClick, 
        handleFileUpload,
        toggleSelection,
        toggleAll,
        handleDeleteSelected,
        handleDeleteAll
    },
    refs: { fileInputRef }
  };
};
