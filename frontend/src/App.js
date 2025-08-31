// import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import AuthorsPage from './pages/AuthorsPage';
// import EventsPage from './pages/EventsPage';
// import EditionsPage from './pages/EditionsPage';
// import { useApi } from './hooks/useApi';
// import { apiEndpoints } from './utils/api';

function App() {
  const [autores, setAutores] = useState([]);
  const [artigos, setArtigos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Buscar artigos
    fetch("http://localhost:8000/artigos")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setArtigos(data);
        setLoading(false);
      }) 
      .catch(() => setLoading(false));

    // Buscar autores
    fetch("http://localhost:8000/autores")
      .then((res) => res.json())
      .then((data) => {
        setAutores(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar autores: ", error);
        setLoading(false);
      })
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <div className="bg-red-500 text-white p-4">Se isso aparecer vermelho, Tailwind está funcionando!</div> */}
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      
      {currentPage === 'home' && (
        <HomePage onNavigate={setCurrentPage} totalArticles={artigos.length} />
      )}
      
      {currentPage === 'articles' && (
        <ArticlesPage artigos={artigos} loading={loading} />
      )}

      {currentPage === 'authors' && (
        <AuthorsPage data={autores} loading={loading} error={null}/>
      )}
    </div>
  );
}

export default App;