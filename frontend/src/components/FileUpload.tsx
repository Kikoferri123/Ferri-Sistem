import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File, category: string, docType: string) => Promise<void>;
  categories?: string[];
  accept?: string;
  label?: string;
}

export default function FileUpload({ onUpload, categories, accept, label }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState(categories?.[0] || 'Documento');
  const fileRef = useRef<HTMLInputElement>(null);

  const defaultCategories = ['Contrato', 'Licenca', 'Comprovante', 'Inventario', 'Foto', 'Outro'];
  const cats = categories || defaultCategories;

  const docType = category === 'Foto' ? 'Foto' : 'Documento';

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await onUpload(selectedFile, category, docType);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      alert('Erro ao enviar arquivo');
    }
    setUploading(false);
  };

  const isImage = selectedFile?.type?.startsWith('image/');
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
        }`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">{label || 'Arraste um arquivo ou clique para selecionar'}</p>
        <p className="text-xs text-gray-400 mt-1">PDF, imagens, Word (max 20MB)</p>
        <input
          ref={fileRef}
          type="file"
          accept={accept || ".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"}
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
          {isImage ? <Image size={20} className="text-cyan-500" /> : <FileText size={20} className="text-blue-500" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-400">{formatSize(selectedFile.size)}</p>
          </div>
          <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center gap-3">
          <select value={category} onChange={e => setCategory(e.target.value)} className="select-field flex-1">
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary px-4 py-2 disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  );
}
