import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleCard from '../components/cards/ArticleCard';

function AuthorDetailPage() {
  const { slug, authorSlug } = useParams();
  const navigate = useNavigate();
  const currentSlug = slug || authorSlug;
  const [autor, setAutor] = useState(null);
  const [artigosPorAno, setArtigosPorAno] = useState({});
  const [totalArtigos, setTotalArtigos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const checkIfFollowing = async () => {
    if (!autor) return;
    try {
      const response = await fetch('http://localhost:8000/autores-seguidos', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const isFollowing = data.autores.some(author => author.id === autor.id);
        setFollowing(isFollowing);
      }
    } catch (error) {
      console.error('Erro ao verificar status de seguir:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!autor) return;
    
    setFollowLoading(true);
    try {
      const response = await fetch('http://localhost:8000/seguir-autor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autor_id: autor.id,
          acao: following ? 'parar_seguir' : 'seguir'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFollowing(!following);
        
        // Exibir mensagem de sucesso
        alert(data.mensagem || 'Ação realizada com sucesso!');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Erro ao realizar ação');
      }
    } catch (error) {
      console.error('Erro ao seguir/parar de seguir:', error);
      alert('Erro ao realizar ação. Tente novamente.');
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    const fetchAutorEArtigos = async () => {
      if (!currentSlug) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching author:', currentSlug); // Debug log
        
        const response = await fetch(`http://localhost:8000/autores/${currentSlug}/artigos`);
        
        if (!response.ok) {
          if (response.status === 404 && authorSlug) {
            // Só redireciona se veio da rota /:authorSlug
            console.log('Author not found, trying as event:', authorSlug);
            navigate(`/eventos/${authorSlug}`, { replace: true });
            return;
          }
          throw new Error(`Erro ${response.status}: Autor não encontrado`);
        }
        
        const data = await response.json();
        console.log('Author data:', data); // Debug log
        
        setAutor(data.autor);
        setArtigosPorAno(data.artigos_por_ano || {});
        setTotalArtigos(data.total_artigos || 0);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAutorEArtigos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug, navigate]);

  // Verificar se está seguindo o autor após carregar os dados
  useEffect(() => {
    if (autor) {
      checkIfFollowing();
    }
  }, [autor]);

  if (loading) return <LoadingSpinner message="Carregando autor..." />;
  if (error) return <div className="text-center py-12 text-red-600">Erro: {error}</div>;
  if (!autor) return <div className="text-center py-12 text-gray-600">Autor não encontrado.</div>;

  // Aplicar filtros
  const anos = Object.keys(artigosPorAno).sort((a, b) => b - a);
  const anosFiltrados = selectedYear === 'all' ? anos : [selectedYear];
  
  const artigosFiltrados = {};
  anosFiltrados.forEach(ano => {
    if (artigosPorAno[ano]) {
      const artigosDoAno = artigosPorAno[ano].filter(artigo => {
        if (!artigo || !artigo.titulo) return false;
        
        const matchesSearch = searchTerm === '' || 
          artigo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (artigo.area && artigo.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (artigo.palavras_chave && artigo.palavras_chave.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesSearch;
      });
      
      if (artigosDoAno.length > 0) {
        artigosFiltrados[ano] = artigosDoAno;
      }
    }
  });

  const totalArtigosFiltrados = Object.values(artigosFiltrados).reduce((total, artigos) => total + artigos.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link to="/authors" className="hover:text-gray-700">Autores</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">{autor.nome} {autor.sobrenome}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {autor.nome} {autor.sobrenome}
              </h1>
              <p className="text-lg text-gray-600">
                {totalArtigos} {totalArtigos === 1 ? 'artigo publicado' : 'artigos publicados'}
              </p>
            </div>
            
            {/* Botão Seguir/Parar de Seguir */}
            <div>
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  following 
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {followLoading 
                  ? 'Carregando...' 
                  : following 
                    ? '✓ Seguindo' 
                    : '+ Seguir Autor'
                }
              </button>
              {following && (
                <p className="text-sm text-gray-500 mt-1 text-right">
                  📧 Você receberá emails sobre novos artigos
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busca por título/área */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar artigos
              </label>
              <input
                type="text"
                placeholder="Título, área ou palavras-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por ano */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por ano
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os anos</option>
                {anos.map(ano => (
                  <option key={ano} value={ano}>
                    {ano} ({artigosPorAno[ano].length} {artigosPorAno[ano].length === 1 ? 'artigo' : 'artigos'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estatísticas de filtros */}
          {(searchTerm || selectedYear !== 'all') && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Mostrando {totalArtigosFiltrados} de {totalArtigos} artigos
                {searchTerm && ` para "${searchTerm}"`}
                {selectedYear !== 'all' && ` em ${selectedYear}`}
              </p>
            </div>
          )}
        </div>

        {Object.keys(artigosFiltrados).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum artigo encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || selectedYear !== 'all' 
                ? 'Tente ajustar os filtros para encontrar artigos.'
                : 'Este autor ainda não possui artigos publicados.'
              }
            </p>
            {(searchTerm || selectedYear !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedYear('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(artigosFiltrados)
              .sort(([anoA], [anoB]) => parseInt(anoB) - parseInt(anoA))
              .map(([ano, artigos]) => (
                <div key={ano} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {ano} ({artigos.length} {artigos.length === 1 ? 'artigo' : 'artigos'})
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {artigos
                        .filter(artigo => artigo && artigo.id && artigo.titulo)
                        .map((artigo) => (
                          <ArticleCard key={artigo.id} artigo={artigo} />
                        ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthorDetailPage;
