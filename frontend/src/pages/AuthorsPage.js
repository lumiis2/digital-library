import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../components/common/Icons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthorCard from '../components/cards/AuthorCard';

const AuthorsPage = ({ data: authors, loading, error, onReload }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Auto-reload quando a página é carregada
  useEffect(() => {
    if (onReload && typeof onReload === 'function') {
      onReload();
    }
  }, [onReload]);

  if (loading) return <LoadingSpinner message="Carregando autores..." />;
  if (error) return <div className="text-center py-12 text-red-600">Erro: {error}</div>;

  // Verificar se authors é um array válido
  const authorsArray = Array.isArray(authors) ? authors : [];
  console.log('📊 AuthorsPage - Total de autores:', authorsArray.length);

  const filteredAuthors = searchTerm.trim() !== "" 
    ? authorsArray.filter(author => 
        author.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.sobrenome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.instituicao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.area_expertise?.toLowerCase().includes(searchTerm.toLowerCase())
      ) : authorsArray;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Autores</h1>
          <p className="text-gray-600">
            Conheça os {authorsArray.length} autores de nossa biblioteca
          </p>
          
          {/* Debug info - remover em produção */}
          <div className="mt-2 text-sm text-gray-500">
            Debug: {authorsArray.length} autores carregados
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar autor
          </label>
          <div className="relative max-w-md">
            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nome, instituição ou área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            {filteredAuthors.length} {filteredAuthors.length === 1 ? 'autor encontrado' : 'autores encontrados'}
          </p>
        </div>

        {authorsArray.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg">
              Nenhum autor encontrado no sistema.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Autores são criados automaticamente quando artigos são adicionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuthors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        )}

        {filteredAuthors.length === 0 && authorsArray.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum autor encontrado com os critérios de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorsPage;