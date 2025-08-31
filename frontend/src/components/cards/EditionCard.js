import React from 'react';
import { DownloadIcon, FolderIcon } from '../common/Icons';

const EditionCard = ({ edition }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
    <div className="p-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
          <FolderIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Edição {edition.ano}
          </h3>
          {edition.evento_id && (
            <p className="text-sm text-gray-600">
              {edition.evento_id}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-medium text-gray-700">Ano:</span>
          <span className="text-gray-600 ml-1">{edition.ano}</span>
        </div>
        
        <div className="text-sm">
          <span className="font-medium text-gray-700">Evento ID:</span>
          <span className="text-gray-600 ml-1">{edition.evento_id}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-gray-500">
            ID: {edition.id}
          </span>
          {edition.artigos_count && (
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
              {edition.artigos_count} artigos
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default EditionCard;