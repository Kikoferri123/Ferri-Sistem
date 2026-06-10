import React, { useState } from 'react';
import { FolderOpen, Search, FileText, Image, File } from 'lucide-react';

export default function Documents() {
  const [search, setSearch] = useState('');

  // Placeholder - document upload requires file storage backend
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FolderOpen size={24} /> Repositorio de Documentos</h1>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documentos..." className="input-field pl-10" />
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Repositorio de Documentos</p>
          <p className="text-gray-400 text-sm mt-2">
            O sistema de upload de documentos requer configuracao de storage (AWS S3 ou Cloudflare R2).
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Categorias disponiveis: Contratos, Licencas, Inventarios, Comprovantes, Fotos
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-gray-400 text-sm"><FileText size={16} /> Contratos</div>
            <div className="flex items-center gap-2 text-gray-400 text-sm"><File size={16} /> Licencas</div>
            <div className="flex items-center gap-2 text-gray-400 text-sm"><Image size={16} /> Fotos</div>
          </div>
        </div>
      </div>
    </div>
  );
}
