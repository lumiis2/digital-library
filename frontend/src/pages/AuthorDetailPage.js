import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleCard from '../components/cards/ArticleCard';

function AuthorDetailPage() {
  const { slug } = useParams();
  const [autor, setAutor] = useState(null);
  const [artigosPorAno, setArtigosPorAno] = useState({});
  const [totalArtigos, setTotalArtigos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    const fetchAutorEArtigos = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`http://localhost:8000/autores/${slug}/artigos`);
        if (!response.ok) {
          throw new Error('Autor não encontrado');
        }
        const data = await response.json();
        
        setAutor(data.autor);
        setArtigosPorAno(data.artigos_por_ano);
        setTotalArtigos(data.total_artigos);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchAutorEArtigos();
    }
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/authors" className="text-blue-600 hover:text-blue-800">
            Voltar para autores
          </Link>
        </div>
      </div>
    );
  }

  if (!autor) return null;

  // Filtrar artigos baseado na busca e ano selecionado
  const getFilteredArticles = () => {
    let filtered = {};
    
    Object.keys(artigosPorAno).forEach(ano => {
      const artigosDoAno = artigosPorAno[ano].filter(artigo => {
        const matchesSearch = searchTerm === '' || 
          artigo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          artigo.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (artigo.palavras_chave && artigo.palavras_chave.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesYear = selectedYear === 'all' || ano.toString() === selectedYear;
        
        return matchesSearch && matchesYear;
      });
      
      if (artigosDoAno.length > 0) {
        filtered[ano] = artigosDoAno;
      }
    });
    
    return filtered;
  };

  const filteredArticles = getFilteredArticles();
  const years = Object.keys(artigosPorAno).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-gray-700">Home</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link to="/authors" className="hover:text-gray-700">Autores</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-gray-900 font-medium">{autor.nome} {autor.sobrenome}</li>
          </ol>
        </nav>

        {/* Header do Autor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {autor.nome} {autor.sobrenome}
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                {totalArtigos} artigos publicados • {years.length} anos de publicação
              </p>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {autor.nome.charAt(0)}{autor.sobrenome.charAt(0)}
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            Explore todos os artigos publicados por {autor.nome} {autor.sobrenome}, organizados por ano de publicação.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar artigos
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o título, área ou palavras-chave..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os anos</option>
                {years.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Artigos por Ano */}
        <div className="space-y-8">
          {Object.keys(filteredArticles).length > 0 ? (
            Object.keys(filteredArticles)
              .sort((a, b) => b - a) // Ordenar anos decrescente
              .map(ano => (
                <div key={ano} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {ano}
                    </h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {filteredArticles[ano].length} artigos
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredArticles[ano].map((artigo) => (
                      <ArticleCard key={artigo.id} article={artigo} />
                    ))}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum artigo encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedYear !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Este autor ainda não possui artigos cadastrados.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Estatísticas do Autor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalArtigos}</div>
              <div className="text-sm text-gray-600">Total de Artigos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{years.length}</div>
              <div className="text-sm text-gray-600">Anos Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {years.length > 0 ? `${Math.min(...years)} - ${Math.max(...years)}` : '-'}
              </div>
              <div className="text-sm text-gray-600">Período</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {totalArtigos > 0 ? Math.round(totalArtigos / years.length * 10) / 10 : 0}
              </div>
              <div className="text-sm text-gray-600">Artigos/Ano</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthorDetailPage;