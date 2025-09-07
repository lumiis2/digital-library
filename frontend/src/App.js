import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import AuthorsPage from './pages/AuthorsPage';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// import EventsPage from './pages/EventsPage';
// import EditionsPage from './pages/EditionsPage';
// import { useApi } from './hooks/useApi';
// import { apiEndpoints } from './utils/api';

function App() {
  const [autores, setAutores] = useState([]);
  const [artigos, setArtigos] = useState([]);
  const [loadingArtigos, setLoading] = useState(true);

  const [autores, setAutores] = useState([]);
  const [loadingAutores, setLoadingAutores] = useState(true);

  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  const [edicoes, setEdicoes] = useState([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(true);

  // Carregamento dos dados
  useEffect(() => {
    // Buscar artigos
    fetch("http://localhost:8000/artigos")
      .then((res) => res.json())
      .then((data) => {
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

  useEffect(() => {
    fetch("http://localhost:8000/autores")
      .then(res => res.json())
      .then(data => {
        setAutores(data);
        setLoadingAutores(false);
      })
      .catch(() => setLoadingAutores(false));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/eventos")
      .then(res => res.json())
      .then(data => {
        setEventos(data);
        setLoadingEventos(false);
      })
      .catch(() => setLoadingEventos(false));
  }, []);

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
        <ArticlesPage artigos={artigos} loading={loading} />
      )}

      {currentPage === 'authors' && (
        <AuthorsPage data={autores} loading={loading} error={null}/>
      )}

      {currentPage === 'login' &&(
        <LoginPage/>
      )}
    </div>
  );
}

export default App;
