import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from '../components/common/Icons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EventCard from '../components/cards/EventCard';
import { useAuth } from '../components/common/AuthContext';

const EventsPage = ({ data: events = [], loading, error, onReload }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated } = useAuth();

  // CORREÇÃO: Verificar se events é um array válido e adicionar debug
  console.log("🔍 EventsPage recebeu:", { events, loading, error });
  const eventsArray = Array.isArray(events) ? events : [];
  console.log("📊 eventsArray:", eventsArray);

  // Recarregar eventos quando a página carregar
  useEffect(() => {
    if (onReload) {
      onReload();
    }
  }, [onReload]);

  if (loading) return <LoadingSpinner message="Carregando eventos..." />;
  if (error) return <div className="text-center py-12 text-red-600">Erro: {error}</div>;

  // CORREÇÃO: Usar eventsArray em vez de events
  const filteredEvents = eventsArray.filter(event => 
    event.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Eventos</h1>
            <p className="text-gray-600">
              Explore os {eventsArray.length} eventos de nossa biblioteca
            </p>
          </div>
          
          {/* Botão de adicionar evento - só para admins */}
          {isAuthenticated && isAdmin() && (
            <button
              onClick={() => navigate("/admin/events/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Novo Evento
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar evento
          </label>
          <div className="relative max-w-md">
            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nome do evento ou sigla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
          </p>
        </div>

        {/* CORREÇÃO: Verificar se há eventos antes de renderizar */}
        {eventsArray.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum evento cadastrado
            </h3>
            <p className="text-gray-600">
              Ainda não há eventos cadastrados no sistema.
            </p>
            {isAuthenticated && isAdmin() && (
              <button
                onClick={() => navigate('/admin/events/new')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cadastrar Primeiro Evento
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {filteredEvents.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Nenhum evento encontrado com os critérios de busca "{searchTerm}".
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Limpar busca
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage;