import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, LocationIcon } from '../common/Icons';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('EventCard clicked, event:', event); // Debug log
    if (event && event.slug) {
      // CORREÇÃO: Navegar para /eventos/:slug
      console.log('Navigating to:', `/eventos/${event.slug}`); // Debug log
      navigate(`/eventos/${event.slug}`);
    } else {
      console.warn('Event has no slug:', event);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {event.nome}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <CalendarIcon className="mr-2" />
              <span className="font-medium uppercase tracking-wide">
                {event.slug}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {event.edicoes_count && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Edições:</span>
              <span className="text-blue-600 ml-1 font-medium">
                {event.edicoes_count}
              </span>
            </div>
          )}

          {event.artigos_count && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Artigos publicados:</span>
              <span className="text-green-600 ml-1 font-medium">
                {event.artigos_count}
              </span>
            </div>
          )}

          {event.ultimo_ano && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Última edição:</span>
              <span className="text-gray-600 ml-1">{event.ultimo_ano}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Conferência Científica
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
