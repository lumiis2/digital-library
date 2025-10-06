import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleCard from '../components/cards/ArticleCard';

function EditionDetailPage() {
  const { slug, ano, eventSlug, year } = useParams();
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
        
        // Buscar dados do evento usando slug
        const eventoResponse = await fetch(`http://localhost:8000/eventos/${currentSlug}`);
        if (!eventoResponse.ok) {
          throw new Error('Evento não encontrado');
        }
        const eventoData = await eventoResponse.json();
        setEvento(eventoData);

        // Tentar buscar dados da edição usando endpoint específico primeiro
        let edicaoData = null;
        try {
          const edicaoResponse = await fetch(`http://localhost:8000/eventos/${currentSlug}/${currentYear}`);
          if (edicaoResponse.ok) {
            edicaoData = await edicaoResponse.json();
          }
        } catch (e) {
          console.log('Endpoint específico não disponível, usando fallback');
        }

        // Se não conseguiu pelo endpoint específico, buscar todas as edições e filtrar
        if (!edicaoData) {
          const edicoesResponse = await fetch(`http://localhost:8000/edicoes`);
          if (!edicoesResponse.ok) {
            throw new Error('Erro ao carregar edições');
          }
          const edicoesData = await edicoesResponse.json();
          
          // Encontrar a edição específica
          const edicaoEncontrada = edicoesData.find(e => 
            e.evento_id === eventoData.id && 
            e.ano.toString() === currentYear.toString()
          );
          
          if (!edicaoEncontrada) {
            throw new Error('Edição não encontrada');
          }
          
          edicaoData = edicaoEncontrada;
        }
        
        console.log('Edição encontrada:', edicaoData);
        console.log('Dados da edição - Descrição:', edicaoData.descricao);
        console.log('Dados da edição - Data início:', edicaoData.data_inicio);
        console.log('Dados da edição - Local:', edicaoData.local);
        console.log('Dados da edição - Site:', edicaoData.site_url);
        setEdicao(edicaoData);

        // Buscar artigos da edição
        try {
          const artigosResponse = await fetch(`http://localhost:8000/eventos/${currentSlug}/${currentYear}/artigos`);
          if (artigosResponse.ok) {
            const artigosData = await artigosResponse.json();
            setArtigos(artigosData);
          } else {
            // Fallback: buscar todos os artigos e filtrar
            const allArtigosResponse = await fetch(`http://localhost:8000/artigos`);
            if (allArtigosResponse.ok) {
              const allArtigos = await allArtigosResponse.json();
              const artigosDaEdicao = allArtigos.filter(artigo => 
                artigo.edicao_id === edicaoData.id
              );
              setArtigos(artigosDaEdicao);
            } else {
              setArtigos([]);
            }
          }
        } catch (e) {
          setArtigos([]);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentSlug && currentYear) {
      fetchEdicaoEArtigos();
    }
  }, [currentSlug, currentYear]); // Fixed dependencies

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
          
          {/* Descrição da edição */}
          {edicao.descricao && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Sobre esta edição</h3>
              <p className="text-gray-700">{edicao.descricao}</p>
            </div>
          )}
          
          {/* Informações da edição */}
          {(edicao.data_inicio || edicao.data_fim || edicao.local || edicao.site_url) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Data */}
              {(edicao.data_inicio || edicao.data_fim) && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data do Evento</p>
                    <p className="text-sm text-gray-600">
                      {edicao.data_inicio && new Date(edicao.data_inicio).toLocaleDateString('pt-BR')}
                      {edicao.data_inicio && edicao.data_fim && ' - '}
                      {edicao.data_fim && new Date(edicao.data_fim).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Local */}
              {edicao.local && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Local</p>
                    <p className="text-sm text-gray-600">{edicao.local}</p>
                  </div>
                </div>
              )}
              
              {/* Site */}
              {edicao.site_url && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Site do Evento</p>
                    <a 
                      href={edicao.site_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-800 underline"
                    >
                      Visitar site oficial
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <p className="text-gray-600 mt-6">
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
              <div className="text-2xl font-bold text-orange-600">{currentYear}</div>
              <div className="text-sm text-gray-600">Ano</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditionDetailPage;