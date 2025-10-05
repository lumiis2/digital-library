import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailIcon, UserIcon } from '../common/Icons';

const AuthorCard = ({ author }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('AuthorCard clicked, author:', author); // Debug log
    if (author && author.slug) {
      // CORREÇÃO: Navegar para /autores/:slug em vez de /:slug
      console.log('Navigating to:', `/autores/${author.slug}`); // Debug log
      navigate(`/autores/${author.slug}`);
    } else {
      console.warn('Author has no slug:', author);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
            <UserIcon className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {author.nome} {author.sobrenome}
            </h3>
            {author.instituicao && (
              <p className="text-sm text-gray-600">{author.instituicao}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {author.email && (
            <div className="flex items-center text-sm text-gray-600">
              <EmailIcon className="mr-2" />
              <a 
                href={`mailto:${author.email}`}
                className="hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {author.email}
              </a>
            </div>
          )}
          
          {author.area_expertise && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Área de expertise:</span>
              <span className="text-gray-600 ml-1">{author.area_expertise}</span>
            </div>
          )}
          
          {author.artigos_count && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">Artigos publicados:</span>
              <span className="text-blue-600 ml-1 font-medium">{author.artigos_count}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorCard;
