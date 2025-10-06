import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderIcon } from '../common/Icons';

const EditionCard = ({ edition, event }) => {
  const navigate = useNavigate();
  
  const handleClick = async () => {
    // Debug para verificar o que temos
    console.log('EditionCard clicado - Edition:', edition);
    console.log('EditionCard clicado - Event:', event);
    
    // Se temos informações do evento, usar o slug
    if (event && event.slug) {
      console.log('Navegando para edição via slug do evento:', event.slug, edition.ano);
      navigate(`/${event.slug}/${edition.ano}`);
    } else {
      // Se não temos o evento, buscar primeiro
      try {
        console.log('Buscando evento para navegação:', edition.evento_id);
        const response = await fetch(`http://localhost:8000/eventos/${edition.evento_id}`);
        if (response.ok) {
          const eventoData = await response.json();
          console.log('Evento encontrado:', eventoData);
          navigate(`/${eventoData.slug}/${edition.ano}`);
        } else {
          console.error('Não foi possível encontrar o evento - status:', response.status);
          // Fallback para página de eventos se não conseguir encontrar
          navigate('/events');
        }
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
        navigate('/events');
      }
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
            <FolderIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Edição {edition.ano}
            </h3>
            {edition.evento_id && (
              <p className="text-sm text-gray-600">
                Evento ID: {edition.evento_id}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Ano:</span>
            <span className="text-gray-600 ml-1">{edition.ano}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-gray-500">
              ID: {edition.id}
            </span>
            {edition.artigos_count && (
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                {edition.artigos_count} artigos
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditionCard;