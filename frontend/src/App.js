// import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import AuthorsPage from './pages/AuthorsPage';
import EventsPage from './pages/EventsPage';
import EditionsPage from './pages/EditionsPage';
// import { useApi } from './hooks/useApi';
// import { apiEndpoints } from './utils/api';

function App() {
  const [artigos, setArtigos] = useState([]);
  const [loadingArtigos, setLoading] = useState(true);

  const [autores, setAutores] = useState([]);
  const [loadingAutores, setLoadingAutores] = useState(true);

  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  const [edicoes, setEdicoes] = useState([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(true);

  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    fetch("http://localhost:8000/artigos")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setArtigos(data);
        setLoading(false);
      }) 
      .catch(() => setLoading(false));
  }, []);

  // Carrega autores
  useEffect(() => {
    fetch("http://localhost:8000/autores")
      .then(res => res.json())
      .then(data => {
        setAutores(data);
        setLoadingAutores(false);
      })
      .catch(() => setLoadingAutores(false));
  }, []);

  // Carrega eventos
  useEffect(() => {
    fetch("http://localhost:8000/eventos")
      .then(res => res.json())
      .then(data => {
        setEventos(data);
        setLoadingEventos(false);
      })
      .catch(() => setLoadingEventos(false));
  }, []);

  // Carrega edições
  useEffect(() => {
    fetch("http://localhost:8000/edicoes")
      .then(res => res.json())
      .then(data => {
        setEdicoes(data);
        setLoadingEdicoes(false);
      })
      .catch(() => setLoadingEdicoes(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <div className="bg-red-500 text-white p-4">Se isso aparecer vermelho, Tailwind está funcionando!</div> */}
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      
      {currentPage === 'home' && (
        <HomePage onNavigate={setCurrentPage} totalArticles={artigos.length} />
      )}
      
      {currentPage === 'articles' && (
        <ArticlesPage artigos={artigos} loading={loadingArtigos} />
      )}

      {currentPage === 'authors' && (
        <AuthorsPage data={autores} loading={loadingAutores} /> //quero adicionar essa pagina
      )}

      {currentPage === 'events' && (
        <EventsPage data={eventos} loading={loadingEventos} /> //quero adicionar essa pagina
      )}

      {currentPage === 'editions' && (
        <EditionsPage data={edicoes} loading={loadingEdicoes} /> //quero adicionar essa pagina
      )}

    </div>
  );
}

export default App;