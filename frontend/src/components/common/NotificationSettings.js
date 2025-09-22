import React, { useState, useEffect } from 'react';

function NotificationSettings({ userId }) {
  const [receberNotificacoes, setReceberNotificacoes] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`http://localhost:8000/usuarios/${userId}/notificacoes`);
        if (response.ok) {
          const data = await response.json();
          setReceberNotificacoes(data.receber_notificacoes);
        }
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPreferences();
    }
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`http://localhost:8000/usuarios/${userId}/notificacoes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receber_notificacoes: receberNotificacoes }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Preferências salvas com sucesso!');
      } else {
        setMessage('Erro ao salvar preferências.');
      }
    } catch (error) {
      setMessage('Erro ao salvar preferências.');
      console.error('Erro:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Preferências de Notificação
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Receber notificações por email
            </label>
            <p className="text-sm text-gray-500">
              Seja notificado quando novos artigos de sua autoria forem publicados
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={receberNotificacoes}
              onChange={(e) => setReceberNotificacoes(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            {message && (
              <span className={`text-sm ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings;