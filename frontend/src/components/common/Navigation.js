import React, { useState } from 'react';
import { BookIcon, UserIcon, CalendarIcon } from './Icons';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Navigation = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'Início', icon: null, path: '/' },
    { id: 'articles', label: 'Artigos', icon: BookIcon, path: '/articles' },
    { id: 'authors', label: 'Autores', icon: UserIcon, path: '/authors' },
    { id: 'events', label: 'Eventos', icon: CalendarIcon, path: '/events' },
  ];

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
  <nav className="bg-papel border-b border-madeira shadow-md font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <BookIcon className="w-8 h-8 text-floresta" />
            <h1 className="text-2xl font-bold text-floresta select-none">
              Digital Library
            </h1>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg text-floresta hover:bg-neblina/15 hover:text-neblina transition-colors font-semibold text-sm shadow-sm border border-madeira"
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Admin Panel Button */}
            {isAuthenticated && isAdmin() && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg text-douradoSol hover:bg-neblina/15 hover:text-neblina transition-colors font-semibold text-sm shadow-sm border border-madeira"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                <span>Painel Admin</span>
              </button>
            )}
          </div>

          {/* Authentication Section */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-lg font-semibold text-floresta hover:bg-neblina/15 hover:text-neblina transition-colors border border-madeira shadow-sm"
                >
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 rounded-lg font-semibold bg-douradoSol text-papel hover:bg-neblina/15 hover:text-neblina transition-colors shadow-sm border border-madeira"
                >
                  Cadastrar
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold text-floresta hover:bg-neblina/15 hover:text-neblina transition-colors border border-madeira shadow-sm"
                >
                  <div className="w-8 h-8 bg-musgo rounded-full flex items-center justify-center select-none">
                    <span className="text-papel font-bold">
                      {user.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline">{user.nome}</span>
                  {isAdmin() && (
                    <span className="hidden sm:inline bg-douradoSol text-floresta px-2 py-0.5 rounded text-xs font-bold select-none">
                      ADMIN
                    </span>
                  )}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-papel rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 border border-madeira">
                    <div className="py-1">
                      {/* Dashboard só para admin */}
                      {isAdmin() && (
                        <button
                          onClick={() => {
                            navigate('/dashboard');
                            setIsUserMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-floresta hover:bg-floresta hover:text-papel rounded transition-colors"
                        >
                          Dashboard
                        </button>
                      )}

                      {/* Perfil sempre visível */}
                      <button
                        onClick={() => {
                          navigate('/configuracoes');
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-floresta hover:bg-floresta hover:text-papel rounded transition-colors"
                      >
                        Perfil
                      </button>

                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => {
                              navigate('/admin/articles/new');
                              setIsUserMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-floresta hover:bg-floresta hover:text-papel rounded transition-colors"
                          >
                            Cadastrar Artigos
                          </button>
                          <button
                            onClick={() => {
                              navigate('/admin/events/new');
                              setIsUserMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-floresta hover:bg-floresta hover:text-papel rounded transition-colors"
                          >
                            Cadastrar Eventos
                          </button>

                          <div className="border-t border-madeira"></div>
                          <button
                            onClick={() => {
                              navigate('/admin');
                              setIsUserMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-douradoSol hover:bg-douradoSol/90 hover:text-papel rounded transition-colors font-bold"
                          >
                            Painel Admin
                          </button>
                        </>
                      )}

                      <div className="border-t border-madeira"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 rounded transition-colors font-semibold"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-md text-floresta hover:text-douradoSol hover:bg-papel transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navigation;

