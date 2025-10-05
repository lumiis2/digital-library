import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/common/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NewEditionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const [formData, setFormData] = useState({
    evento_id: '',
    ano: new Date().getFullYear(),
    slug: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    local: '',
    site_url: ''
  });

  const [errors, setErrors] = useState({});

  // TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER RETURN CONDICIONAL

  // Verificar acesso
  useEffect(() => {
    if (!user || !isAdmin()) {
      setAccessDenied(true);
    }
  }, [user, isAdmin]);

  // Carregar eventos
  useEffect(() => {
    if (accessDenied) return;
    
    const fetchEventos = async () => {
      try {
        const response = await fetch('http://localhost:8000/eventos');
        if (!response.ok) throw new Error('Erro ao carregar eventos');
        const data = await response.json();
        setEventos(data);
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
      } finally {
        setLoadingEventos(false);
      }
    };

    fetchEventos();
  }, [accessDenied]);

  // Se está editando, carregar dados da edição
  useEffect(() => {
    if (accessDenied || !id) return;
    
    const fetchEdicao = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/edicoes/${id}`);
        if (!response.ok) throw new Error('Edição não encontrada');
        const data = await response.json();
        
        setFormData({
          evento_id: data.evento_id || '',
          ano: data.ano || new Date().getFullYear(),
          slug: data.slug || '',
          descricao: data.descricao || '',
          data_inicio: data.data_inicio ? data.data_inicio.split('T')[0] : '',
          data_fim: data.data_fim ? data.data_fim.split('T')[0] : '',
          local: data.local || '',
          site_url: data.site_url || ''
        });
      } catch (error) {
        console.error('Erro ao carregar edição:', error);
        setErrors({ submit: 'Erro ao carregar dados da edição' });
      } finally {
        setLoading(false);
      }
    };

    fetchEdicao();
  }, [id, accessDenied]);

  // Gerar slug automaticamente
  useEffect(() => {
    if (accessDenied) return;
    
    if (formData.evento_id && formData.ano) {
      const eventoSelecionado = eventos.find(e => e.id.toString() === formData.evento_id.toString());
      if (eventoSelecionado) {
        const slug = `${eventoSelecionado.slug}-${formData.ano}`;
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  }, [formData.evento_id, formData.ano, eventos, accessDenied]);

  // AGORA SIM PODEMOS FAZER RETURNS CONDICIONAIS

  // Verificar se é admin - DEPOIS de todos os hooks
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium">Acesso Negado</h3>
          <p className="text-red-600 mt-2">Apenas administradores podem criar edições</p>
        </div>
      </div>
    );
  }

  if (loadingEventos) {
    return <LoadingSpinner message="Carregando eventos..." />;
  }

  if (loading) {
    return <LoadingSpinner message={id ? "Carregando edição..." : "Salvando edição..."} />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo alterado
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.evento_id) {
      newErrors.evento_id = 'Selecione um evento';
    }

    if (!formData.ano || formData.ano < 1990 || formData.ano > 2050) {
      newErrors.ano = 'Ano deve estar entre 1990 e 2050';
    }

    if (!formData.slug) {
      newErrors.slug = 'Slug é obrigatório';
    }

    if (formData.data_inicio && formData.data_fim && formData.data_inicio > formData.data_fim) {
      newErrors.data_fim = 'Data de fim deve ser posterior à data de início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const url = id ? `http://localhost:8000/edicoes/${id}` : 'http://localhost:8000/edicoes';
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...formData,
          ano: parseInt(formData.ano),
          evento_id: parseInt(formData.evento_id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao salvar edição');
      }

      const result = await response.json();
      
      // Navegar para a página da edição criada/editada
      navigate(`/eventos/${result.evento?.slug || 'evento'}/${result.ano}`);
      
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const eventoSelecionado = eventos.find(e => e.id.toString() === formData.evento_id.toString());

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {id ? 'Editar Edição' : 'Nova Edição'}
            </h1>
            <p className="text-gray-600 mt-2">
              {id ? 'Atualize os dados da edição' : 'Crie uma nova edição para um evento existente'}
            </p>
          </div>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção do Evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evento *
              </label>
              <select
                name="evento_id"
                value={formData.evento_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.evento_id ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Selecione um evento</option>
                {eventos.map(evento => (
                  <option key={evento.id} value={evento.id}>
                    {evento.sigla} ({evento.slug.toUpperCase()})
                  </option>
                ))}
              </select>
              {errors.evento_id && (
                <p className="mt-1 text-sm text-red-600">{errors.evento_id}</p>
              )}
            </div>

            {/* Preview do Evento Selecionado */}
            {eventoSelecionado && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Evento Selecionado:</h3>
                <p className="text-blue-700">
                  <strong>{eventoSelecionado.nome}</strong> ({eventoSelecionado.slug.toUpperCase()})
                </p>
                {eventoSelecionado.descricao && (
                  <p className="text-blue-600 text-sm mt-1">{eventoSelecionado.descricao}</p>
                )}
              </div>
            )}

            {/* Ano */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano da Edição *
              </label>
              <input
                type="number"
                name="ano"
                value={formData.ano}
                onChange={handleChange}
                min="1990"
                max="2050"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.ano ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.ano && (
                <p className="mt-1 text-sm text-red-600">{errors.ano}</p>
              )}
            </div>

            {/* Slug (gerado automaticamente) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug da Edição
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="Será gerado automaticamente"
                readOnly
              />
              <p className="mt-1 text-sm text-gray-500">
                Gerado automaticamente baseado no evento e ano
              </p>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição da Edição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva características específicas desta edição..."
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início
                </label>
                <input
                  type="date"
                  name="data_inicio"
                  value={formData.data_inicio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim
                </label>
                <input
                  type="date"
                  name="data_fim"
                  value={formData.data_fim}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.data_fim ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.data_fim && (
                  <p className="mt-1 text-sm text-red-600">{errors.data_fim}</p>
                )}
              </div>
            </div>

            {/* Local */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local do Evento
              </label>
              <input
                type="text"
                name="local"
                value={formData.local}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: São Paulo, SP - Brasil"
              />
            </div>

            {/* Site URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site da Edição
              </label>
              <input
                type="url"
                name="site_url"
                value={formData.site_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://exemplo.com/evento-2024"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Salvando...' : (id ? 'Atualizar Edição' : 'Criar Edição')}
              </button>
            </div>
          </form>
        </div>

        {/* Dica sobre edições */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">💡 Sobre Edições</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Uma edição representa uma ocorrência específica de um evento (ex: SBES 2024)</li>
            <li>• Cada edição pode ter seus próprios artigos, datas e informações específicas</li>
            <li>• O slug é gerado automaticamente no formato: evento-ano (ex: sbes-2024)</li>
            <li>• Certifique-se de que o evento já foi criado antes de criar a edição</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NewEditionPage;