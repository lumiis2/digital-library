import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleCard from '../components/cards/ArticleCard';

function EditionDetailPage() {
  const { slug, ano, eventoId, eventSlug, year } = useParams();
  const [evento, setEvento] = useState(null);
  const [edicao, setEdicao] = useState(null);
  const [artigos, setArtigos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determinar qual formato de parâmetros estamos usando
  const currentSlug = eventSlug || slug; // Rota amigável ou original
  const currentYear = year || ano; // Rota amigável ou original

  useEffect(() => {
    const fetchEdicaoEArtigos = async () => {
      try {
        setLoading(true);
        
        // Determinar se estamos usando slug ou eventoId
        const isUsingEventoId = eventoId && !currentSlug;
        // const isUsingFriendlyUrl = !(eventSlug === 'edicao-id' && !isNaN(parseInt(year)));
        
        if (isUsingEventoId) {
          // Abordagem alternativa: buscar edição diretamente usando evento_id
          // Por enquanto, vamos simular os dados já que não temos todos os endpoints
          setEvento({ nome: `Evento ${eventoId}`, slug: `evento-${eventoId}` });
          setEdicao({ evento_id: eventoId, ano: parseInt(currentYear) });
          setArtigos([]); // Por enquanto vazio
          setLoading(false);
          return;
        }
        
        // Buscar dados do evento usando slug (implementação original + friendly URLs)
        const eventoResponse = await fetch(`http://localhost:8000/eventos/${currentSlug}`);
        if (!eventoResponse.ok) {
          throw new Error('Evento não encontrado');
        }
        const eventoData = await eventoResponse.json();
        setEvento(eventoData);

        // Buscar dados da edição
        const edicaoResponse = await fetch(`http://localhost:8000/eventos/${currentSlug}/${currentYear}`);
        if (!edicaoResponse.ok) {
          throw new Error('Edição não encontrada');
        }
        const edicaoData = await edicaoResponse.json();
        setEdicao(edicaoData);

        // Buscar artigos da edição
        const artigosResponse = await fetch(`http://localhost:8000/eventos/${currentSlug}/${currentYear}/artigos`);
        if (!artigosResponse.ok) {
          throw new Error('Erro ao carregar artigos');
        }
        const artigosData = await artigosResponse.json();
        setArtigos(artigosData);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if ((currentSlug && currentYear) || (eventoId && currentYear)) {
      fetchEdicaoEArtigos();
    }
  }, [eventSlug, year]); // Added missing dependencies

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/eventos" className="text-blue-600 hover:text-blue-800">
            Voltar para eventos
          </Link>
        </div>
      </div>
    );
  }

  if (!evento || !edicao) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-gray-700">Home</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link to="/eventos" className="hover:text-gray-700">Eventos</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link to={`/${currentSlug || evento.slug}`} className="hover:text-gray-700">{evento.nome}</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-gray-900 font-medium">{currentYear}</li>
          </ol>
        </nav>

        {/* Header da Edição */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {evento.nome} {currentYear}
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Edição de {currentYear} • {artigos.length} artigos publicados
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full block mb-2">
                {evento.slug.toUpperCase()}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {currentYear}
              </span>
            </div>
          </div>
          <p className="text-gray-600">
            Explore todos os artigos publicados na edição de {currentYear} do {evento.nome}.
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar artigos
              </label>
              <input
                type="text"
                placeholder="Digite o título do artigo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todas as áreas</option>
                {[...new Set(artigos.map(a => a.area))].map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Artigos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Artigos ({artigos.length})
            </h2>
            <div className="flex items-center space-x-4">
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="titulo">Ordenar por título</option>
                <option value="autor">Ordenar por autor</option>
                <option value="area">Ordenar por área</option>
              </select>
            </div>
          </div>

          {artigos.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {artigos.map((artigo) => (
                <ArticleCard key={artigo.id} artigo={artigo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum artigo encontrado
              </h3>
              <p className="text-gray-600">
                Esta edição ainda não possui artigos cadastrados.
              </p>
            </div>
          )}
        </div>

        {/* Estatísticas da Edição */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas da Edição</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{artigos.length}</div>
              <div className="text-sm text-gray-600">Artigos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {[...new Set(artigos.flatMap(a => a.authors || []))].length}
              </div>
              <div className="text-sm text-gray-600">Autores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {[...new Set(artigos.map(a => a.area))].length}
              </div>
              <div className="text-sm text-gray-600">Áreas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{ano}</div>
              <div className="text-sm text-gray-600">Ano</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditionDetailPage;