import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import AuthorsPage from './pages/AuthorsPage';
import EventsPage from './pages/EventsPage';
import EditionsPage from './pages/EditionsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
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
    fetch("http://localhost:8000/artigos")
      .then((res) => res.json())
      .then((data) => {
        setArtigos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
      <Navigation />

      <Routes>
        <Route path="/" element={<HomePage totalArticles={artigos.length} />} />
        <Route path="/articles" element={<ArticlesPage artigos={artigos} loading={loadingArtigos} />} />
        <Route path="/authors" element={<AuthorsPage data={autores} loading={loadingAutores} />} />
        <Route path="/events" element={<EventsPage data={eventos} loading={loadingEventos} />} />
        <Route path="/editions" element={<EditionsPage data={edicoes} loading={loadingEdicoes} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
}

export default App;
