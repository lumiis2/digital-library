import React, { useState, useEffect } from 'react';
import { SearchIcon} from '../components/common/Icons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EditionCard from '../components/cards/EditionCard';

const EditionsPage = ({ data: editions, loading, error, onReload }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");

  // Auto-reload quando a página é carregada
  useEffect(() => {
    if (onReload) {
      onReload();
    }
  }, [onReload]);

  if (loading) return <LoadingSpinner message="Carregando edições..." />;
  if (error) return <div className="text-center py-12 text-red-600">Erro: {error}</div>;
  if (!editions || !Array.isArray(editions)) return <div className="text-center py-12">Nenhuma edição encontrada.</div>;

  const years = [...new Set(editions.map(e => e.ano))].sort((a, b) => b - a);
  
  const filteredEditions = editions.filter(edition => {
    const matchesSearch = edition.ano?.toString().includes(searchTerm);
    const matchesYear = selectedYear === "all" || edition.ano?.toString() === selectedYear;
    return matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edições</h1>
          <p className="text-gray-600">
            Explore as {editions.length} edições de eventos acadêmicos
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ano ou nome do evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os anos</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            {filteredEditions.length} {filteredEditions.length === 1 ? 'edição encontrada' : 'edições encontradas'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditions.map((edition) => (
            <EditionCard key={edition.id} edition={edition} />
          ))}
        </div>

        {filteredEditions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhuma edição encontrada com os critérios de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditionsPage;