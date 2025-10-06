import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../components/common/Icons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ArticleCard from '../components/cards/ArticleCard';

const ArticlesPage = ({ artigos = [], loading, error }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [eventos, setEventos] = useState([]);
  const [edicoes, setEdicoes] = useState([]);

  // 🔹 Buscar eventos e edições
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resEventos, resEdicoes] = await Promise.all([
          fetch("http://localhost:8000/eventos"),
          fetch("http://localhost:8000/edicoes"),
        ]);
        const dataEventos = await resEventos.json();
        const dataEdicoes = await resEdicoes.json();
        setEventos(dataEventos);
        setEdicoes(dataEdicoes);
      } catch (err) {
        console.error("Erro ao carregar eventos/edições:", err);
      }
    };
    fetchData();
  }, []);

  // 🔹 Pega o nome do evento correspondente à edição do artigo
  const getEventoNome = (artigo) => {
    if (!artigo?.edicao_id) return null;
    const edicao = edicoes.find(e => e.id === artigo.edicao_id);
    if (!edicao) return null;
    const evento = eventos.find(ev => ev.id === edicao.evento_id);
    
    return evento ? evento.nome?.toLowerCase() : null;
  };

  if (loading) return <LoadingSpinner message="Carregando artigos..." />;
  if (error) return <div className="text-center py-12 text-red-600">Erro: {error}</div>;

  const areas = [...new Set((artigos || []).map(a => a.area))];

  const filteredArtigos = artigos.filter((artigo) => {
    const termo = searchTerm.toLowerCase().trim();
    const eventoNome = getEventoNome(artigo);

    if (termo.length > 0) {
      const matchesSearch =
        (artigo.titulo && artigo.titulo.toLowerCase().includes(termo)) ||
        (artigo.palavras_chave && artigo.palavras_chave.toLowerCase().includes(termo)) ||
        (artigo.authors &&
          artigo.authors.some(author =>
            `${author.nome} ${author.sobrenome}`.toLowerCase().includes(termo)
          )) ||
        (eventoNome && eventoNome.includes(termo)); // ✅ só compara se eventoNome existir

      return matchesSearch;
    }

    // Filtro por área (corrigido)
    const matchesArea = selectedArea === "none" || artigo.area === selectedArea;
    return matchesArea;
  });

  const destaqueArtigos = artigos.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artigos</h1>
          <p className="text-gray-600">
            Explore nossa coleção de {artigos.length} artigos acadêmicos
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo de busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Título, autor, palavras-chave ou evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtro por área */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">Nenhum</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Destaques */}
        {destaqueArtigos.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Destaques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destaqueArtigos.map((artigo) => (
                <ArticleCard key={artigo.id} artigo={artigo} />
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="mb-4">
          <p className="text-gray-600">
            {filteredArtigos.length}{" "}
            {filteredArtigos.length === 1
              ? "artigo encontrado"
              : "artigos encontrados"}
          </p>
        </div>

        {/* Grade de artigos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtigos.map((artigo) => (
            <ArticleCard key={artigo.id} artigo={artigo} />
          ))}
        </div>

        {filteredArtigos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum artigo encontrado com os critérios de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;
