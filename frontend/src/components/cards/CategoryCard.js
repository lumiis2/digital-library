import React from 'react';
import { FolderIcon, ArrowRightIcon } from '../common/Icons';

const CategoryCard = ({ category, onClick }) => (
  <div 
    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden cursor-pointer group"
    onClick={() => onClick && onClick(category)}
  >
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <FolderIcon className="w-6 h-6 text-white" />
        </div>
        <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {category.nome || category.area}
      </h3>
      
      {category.descricao && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {category.descricao}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {category.artigos_count || 0} artigos
        </span>
        {category.artigos_recentes && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {category.artigos_recentes} novos
          </span>
        )}
      </div>
    </div>
  </div>
);

export default CategoryCard;