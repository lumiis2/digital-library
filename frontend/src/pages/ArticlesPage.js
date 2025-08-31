import React, { useState } from 'react';
import { SearchIcon } from '../components/common/Icons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleCard from '../components/cards/ArticleCard';

const ArticlesPage = ({ artigos = [], loading, error }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");

  if (loading) return <LoadingSpinner message="Carregando artigos..." />;
  if (error) return <div className="text-center py-12 text-red-600">Erro: {error}</div>;

  const areas = [...new Set((artigos || []).map(a => a.area))];

  const filteredArtigos = artigos.filter(artigo => {
    const matchesSearch = artigo.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artigo.palavras_chave?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artigo.authors?.some(author => 
                           `${author.nome} ${author.sobrenome}`.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesArea = selectedArea === "all" || artigo.area === selectedArea;
    
    if(searchTerm.trim() !== ""){
      return matchesSearch;
    }

    return matchesArea;
  });

  // pega 3 artigos de destaque (aqui só pego os 3 primeiros como exemplo)
  const destaqueArtigos = artigos.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artigos</h1>
          <p className="text-gray-600">
            Explore nossa coleção de {artigos.length} artigos acadêmicos
          </p>
        </div>

        {/* Filters */}
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
                  placeholder="Título, palavras-chave ou autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">Nenhum</option>
                <option value="all">Todas as áreas</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Destaques */}
        {destaqueArtigos.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Destaques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destaqueArtigos.map((artigo) => (
                <ArticleCard key={artigo.id} artigo={artigo} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            {filteredArtigos.length} {filteredArtigos.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtigos.map((artigo) => (
            <ArticleCard key={artigo.id} artigo={artigo} />
          ))}
        </div>

        {filteredArtigos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum artigo encontrado com os critérios de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;
