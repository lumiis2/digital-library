import React from 'react';
import { DownloadIcon } from '../common/Icons';

const ArticleCard = ({ artigo }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden group">
    <div className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {artigo.titulo}
      </h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <span className="font-medium text-gray-700 mr-2">Área:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            {artigo.area}
          </span>
        </div>
        
        {artigo.palavras_chave && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Palavras-chave:</span>
            <span className="text-gray-600 ml-1">{artigo.palavras_chave}</span>
          </div>
        )}
        
        {artigo.authors && artigo.authors.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Autores:</span>
            <span className="text-gray-600 ml-1">
              {artigo.authors.map(a => `${a.nome} ${a.sobrenome}`.trim()).join(", ")}
            </span>
          </div>
        )}
      </div>

      {artigo.pdf_path && (
        <a
          href={artigo.pdf_path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <DownloadIcon />
          <span>Baixar PDF</span>
        </a>
      )}
    </div>
  </div>
);

export default ArticleCard;