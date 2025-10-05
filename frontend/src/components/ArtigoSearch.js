import React, { useState } from 'react';
import { api } from '../utils/api';
import './ArtigoSearch.css';

const ArtigoSearch = () => {
  const [query, setQuery] = useState('');
  const [campo, setCampo] = useState('titulo');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Por favor, digite algo para pesquisar');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let response;
      
      switch (campo) {
        case 'titulo':
          response = await api.searchArtigosByTitulo(query);
          break;
        case 'autor':
          response = await api.searchArtigosByAutor(query);
          break;
        case 'evento':
          response = await api.searchArtigosByEvento(query);
          break;
        default:
          response = await api.searchArtigos(query, campo);
      }
      
      setResultados(response);
    } catch (err) {
      setError('Erro ao buscar artigos: ' + err.message);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResultados([]);
    setError('');
  };

  return (
    <div className="artigo-search">
      <h2>Buscar Artigos</h2>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-controls">
          <div className="input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite sua pesquisa..."
              className="search-input"
            />
          </div>
          
          <div className="select-group">
            <label htmlFor="campo-select">Buscar por:</label>
            <select
              id="campo-select"
              value={campo}
              onChange={(e) => setCampo(e.target.value)}
              className="campo-select"
            >
              <option value="titulo">Título</option>
              <option value="autor">Autor</option>
              <option value="evento">Nome do Evento</option>
            </select>
          </div>
          
          <div className="button-group">
            <button type="submit" disabled={loading} className="search-button">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button type="button" onClick={clearSearch} className="clear-button">
              Limpar
            </button>
          </div>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {resultados.length > 0 && (
        <div className="search-results">
          <h3>Resultados da Busca ({resultados.length} encontrado{resultados.length !== 1 ? 's' : ''})</h3>
          
          <div className="artigos-list">
            {resultados.map((artigo) => (
              <div key={artigo.id} className="artigo-card">
                <h4>{artigo.titulo}</h4>
                <p><strong>Autores:</strong> {artigo.autores?.join(', ') || 'N/A'}</p>
                <p><strong>Evento:</strong> {artigo.evento || 'N/A'}</p>
                <p><strong>Ano:</strong> {artigo.ano || 'N/A'}</p>
                <p><strong>Páginas:</strong> {artigo.paginas || 'N/A'}</p>
                {artigo.editora && <p><strong>Editora:</strong> {artigo.editora}</p>}
                {artigo.local && <p><strong>Local:</strong> {artigo.local}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && resultados.length === 0 && query && !error && (
        <div className="no-results">
          Nenhum artigo encontrado para "{query}" no campo "{campo}".
        </div>
      )}
    </div>
  );
};

export default ArtigoSearch;