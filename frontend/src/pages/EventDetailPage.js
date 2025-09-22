import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EditionCard from '../components/cards/EditionCard';

function EventDetailPage() {
  const { slug } = useParams();
  const [evento, setEvento] = useState(null);
  const [edicoes, setEdicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventoEEdicoes = async () => {
      try {
        setLoading(true);
        
        // Buscar dados do evento
        const eventoResponse = await fetch(`http://localhost:8000/eventos/${slug}`);
        if (!eventoResponse.ok) {
          throw new Error('Evento não encontrado');
        }
        const eventoData = await eventoResponse.json();
        setEvento(eventoData);

        // Buscar edições do evento
        const edicoesResponse = await fetch(`http://localhost:8000/eventos/${slug}/edicoes`);
        if (!edicoesResponse.ok) {
          throw new Error('Erro ao carregar edições');
        }
        const edicoesData = await edicoesResponse.json();
        setEdicoes(edicoesData);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEventoEEdicoes();
    }
  }, [slug]);

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

  if (!evento) return null;

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
            <li className="text-gray-900 font-medium">{evento.nome}</li>
          </ol>
        </nav>

        {/* Header do Evento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{evento.nome}</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {evento.slug.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600">
            Explore todas as edições e artigos publicados neste evento científico.
          </p>
        </div>

        {/* Edições */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Edições ({edicoes.length})
            </h2>
          </div>

          {edicoes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {edicoes
                .sort((a, b) => b.ano - a.ano) // Ordenar por ano decrescente
                .map((edicao) => (
                  <Link 
                    key={edicao.id} 
                    to={`/eventos/${slug}/${edicao.ano}`}
                    className="block hover:transform hover:scale-105 transition-transform"
                  >
                    <EditionCard 
                      edition={edicao} 
                      eventName={evento.nome}
                      eventSlug={slug}
                    />
                  </Link>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma edição encontrada
              </h3>
              <p className="text-gray-600">
                Este evento ainda não possui edições cadastradas.
              </p>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{edicoes.length}</div>
              <div className="text-sm text-gray-600">Edições</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {edicoes.reduce((total, edicao) => total + (edicao.articles?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Artigos Totais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {edicoes.length > 0 ? `${Math.min(...edicoes.map(e => e.ano))} - ${Math.max(...edicoes.map(e => e.ano))}` : '-'}
              </div>
              <div className="text-sm text-gray-600">Período</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;