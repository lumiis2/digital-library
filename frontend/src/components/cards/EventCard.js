import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ArrowRightIcon } from '../common/Icons';

const EventCard = ({ event }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (event.slug) {
      navigate(`/eventos/${event.slug}`);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <CalendarIcon className="w-6 h-6 text-white" />
        </div>
        <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
        {event.nome}
      </h3>

      {event.slug && (
        <p className="text-sm text-gray-600 uppercase tracking-wider mb-2">
          {event.slug}
        </p>
      )}

      {event.descricao && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {event.descricao}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">ID: {event.id}</span>
        {event.edicoes_count && (
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            {event.edicoes_count} edições
          </span>
        )}
      </div>
    </div>
    </div>
  );
};

export default EventCard;
