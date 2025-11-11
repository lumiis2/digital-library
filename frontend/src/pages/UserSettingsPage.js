import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/common/AuthContext';
import NotificationSettings from '../components/common/NotificationSettings';

function UserSettingsPage() {
  const { user, getUserProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user || !user.id) {
          setError("Usuário não está logado");
          setLoading(false);
          return;
        }

        const result = await getUserProfile();
        
        if (result.success) {
          setProfileData(result.data);
        } else {
          setError(result.error || 'Erro ao carregar perfil');
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, getUserProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium">Erro ao carregar perfil</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <Link 
            to="/login" 
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  const displayUser = profileData || user;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-gray-700">Home</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-gray-900 font-medium">Configurações</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>

        {/* Informações do Usuário */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Informações da Conta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <p className="text-sm text-gray-900">{displayUser?.nome}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-sm text-gray-900">{displayUser?.email}</p>
            </div>
            {displayUser?.perfil && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuário
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  displayUser.perfil === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {displayUser.perfil === 'admin' ? 'Administrador' : 'Usuário'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Configurações de Notificação */}
        {user && <NotificationSettings userId={user.id} />}

        {/* Outras Configurações */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Outras Configurações
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Perfil público
                </label>
                <p className="text-sm text-gray-500">
                  Permitir que outros usuários vejam seu perfil de autor
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Indexação por mecanismos de busca
                </label>
                <p className="text-sm text-gray-500">
                  Permitir que mecanismos de busca indexem seus artigos
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Informações sobre Privacidade */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Sobre as notificações por email
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  Quando você ativa as notificações por email, receberá automaticamente um email sempre que um novo artigo 
                  de sua autoria for cadastrado no sistema. Isso inclui artigos adicionados manualmente por administradores 
                  ou importados via BibTeX.
                </p>
                <p className="mt-2">
                  Você pode desativar essas notificações a qualquer momento alterando a configuração acima.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserSettingsPage;