import React from 'react';
import { BookIcon, UserIcon, FolderIcon, SearchIcon } from './Icons';

const Navigation = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Início', icon: null },
    { id: 'articles', label: 'Artigos', icon: BookIcon },
    { id: 'authors', label: 'Autores', icon: UserIcon },
    { id: 'categories', label: 'Categorias', icon: FolderIcon },
    { id: 'login', label: "Login", icon: UserIcon},
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <BookIcon />
            <h1 className="text-xl font-bold text-gray-900">Digital Library</h1>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    currentPage === item.id 
                      ? 'text-blue-700 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;