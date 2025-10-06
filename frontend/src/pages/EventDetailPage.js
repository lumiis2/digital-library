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

        // Buscar edições deste evento
        const edicoesResponse = await fetch(`http://localhost:8000/edicoes`);
        if (edicoesResponse.ok) {
          const edicoesData = await edicoesResponse.json();
          // Filtrar edições deste evento
          const edicoesDeste = edicoesData.filter(edicao => 
            edicao.evento_id === eventoData.id
          );
          setEdicoes(edicoesDeste);
        } else {
          setEdicoes([]);
        }
        
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
          <Link to="/events" className="text-blue-600 hover:text-blue-800">
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
            <li><Link to="/events" className="hover:text-gray-700">Eventos</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-gray-900 font-medium">{evento.nome}</li>
          </ol>
        </nav>

        {/* Header do Evento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {evento.nome}
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                {edicoes.length} edições disponíveis
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {evento.slug.toUpperCase()}
              </span>
            </div>
          </div>
          
          {evento.descricao && (
            <div className="mb-4">
              <p className="text-gray-700">{evento.descricao}</p>
            </div>
          )}
        </div>

        {/* Lista de Edições */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Edições ({edicoes.length})
            </h2>
          </div>

          {edicoes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {edicoes.map((edicao) => (
                <EditionCard 
                  key={edicao.id} 
                  edition={edicao} 
                  event={evento}
                />
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

        {/* Estatísticas do Evento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas do Evento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{edicoes.length}</div>
              <div className="text-sm text-gray-600">Edições</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {edicoes.length > 0 ? Math.min(...edicoes.map(e => e.ano)) : '-'}
              </div>
              <div className="text-sm text-gray-600">Primeira Edição</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {edicoes.length > 0 ? Math.max(...edicoes.map(e => e.ano)) : '-'}
              </div>
              <div className="text-sm text-gray-600">Última Edição</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;