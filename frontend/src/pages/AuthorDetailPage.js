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

  if (loading) return <LoadingSpinner message="Carregando autor..." />;
  if (error) return <div className="text-center py-12 text-red-600">Erro: {error}</div>;
  if (!autor) return <div className="text-center py-12 text-gray-600">Autor não encontrado.</div>;

  const anos = Object.keys(artigosPorAno).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link to="/authors" className="hover:text-gray-700">Autores</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">{autor.nome} {autor.sobrenome}</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {autor.nome} {autor.sobrenome}
          </h1>
          <p className="text-lg text-gray-600">
            {totalArtigos} {totalArtigos === 1 ? 'artigo publicado' : 'artigos publicados'}
          </p>
        </div>

        {anos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum artigo encontrado</h3>
            <p className="text-gray-600">Este autor ainda não possui artigos publicados.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {anos.map((ano) => (
              <div key={ano} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {ano} ({artigosPorAno[ano].length} {artigosPorAno[ano].length === 1 ? 'artigo' : 'artigos'})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {artigosPorAno[ano]
                      .filter(artigo => artigo && artigo.id && artigo.titulo) // Filtrar artigos válidos
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
