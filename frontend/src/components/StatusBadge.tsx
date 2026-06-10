import React from 'react';

const colors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-600',
  em_negociacao: 'bg-yellow-100 text-yellow-700',
  prospecto: 'bg-blue-100 text-blue-700',
  encerrado: 'bg-red-100 text-red-700',
  vigente: 'bg-green-100 text-green-700',
  expirado: 'bg-red-100 text-red-700',
  cancelado: 'bg-gray-100 text-gray-600',
  pendente: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
  'A-Estrela': 'bg-green-100 text-green-700',
  'B-Bom': 'bg-blue-100 text-blue-700',
  'C-Regular': 'bg-yellow-100 text-yellow-700',
  'D-Atencao': 'bg-red-100 text-red-700',
  'S/Dados': 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = colors[status] || 'bg-gray-100 text-gray-600';
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
      {label}
    </span>
  );
}
