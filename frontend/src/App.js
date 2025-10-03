import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // <-- adicione useNavigate
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import AuthorsPage from './pages/AuthorsPage';
import EventsPage from './pages/EventsPage';
import EditionsPage from './pages/EditionsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminArticlesPage from './pages/AdminArticlesPage';
import NewArticlePage from './pages/NewArticlePage';  
import AdminDashboard from './pages/AdminDashboard';
import AdminPanel from './pages/AdminPanel';
import backgroundImage from './assets/background.png';
import NewEventPage from './pages/NewEventPage';
import EditEventPage from './pages/EditEventPage';
import EventDetailPage from './pages/EventDetailPage';
import EditionDetailPage from './pages/EditionDetailPage';
import AuthorDetailPage from './pages/AuthorDetailPage';
import UserSettingsPage from './pages/UserSettingsPage';
import NewEditionPage from './pages/NewEditionPage';

function App() {
  const [artigos, setArtigos] = useState([]);
  const [loadingArtigos, setLoading] = useState(true);
  const [autores, setAutores] = useState([]);
  const [loadingAutores, setLoadingAutores] = useState(true);
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [edicoes, setEdicoes] = useState([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(true);

  const navigate = useNavigate(); // <-- hook para navegação

  // Função para recarregar eventos
  const reloadEventos = useCallback(() => {
    setLoadingEventos(true);
    fetch("http://localhost:8000/eventos")
      .then(res => res.json())
      .then(data => { setEventos(data); setLoadingEventos(false); })
      .catch(() => setLoadingEventos(false));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/artigos")
      .then(res => res.json())
      .then(data => { setArtigos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/autores")
      .then(res => res.json())
      .then(data => { setAutores(data); setLoadingAutores(false); })
      .catch(() => setLoadingAutores(false));
  }, []);

  useEffect(() => {
    reloadEventos();
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/edicoes")
      .then(res => res.json())
      .then(data => { setEdicoes(data); setLoadingEdicoes(false); })
      .catch(() => setLoadingEdicoes(false));
  }, []);

  

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white/25 min-h-screen backdrop-blur-sm">
        <Navigation />

        <div className="flex flex-col items-center justify-start pt-4 space-y-6 px-4">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  totalArticles={artigos.length}
                  onNavigate={route => navigate(route.startsWith('/') ? route : `/${route}`)}
                />
              }
            />
            <Route path="/articles" element={<ArticlesPage artigos={artigos} loading={loadingArtigos} />} />
            <Route path="/authors" element={<AuthorsPage data={autores} loading={loadingAutores} />} />
            <Route path="/events" element={<EventsPage data={eventos} loading={loadingEventos} onReload={reloadEventos} />} />
            <Route path="/editions" element={<EditionsPage data={edicoes} loading={loadingEdicoes} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/my-articles" element={<AdminArticlesPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/articles" element={<NewArticlePage />} />
            <Route path="/admin/events" element={<NewEventPage />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/events/:id/edit" element={<EditEventPage/>} />
            <Route path="/configuracoes" element={<UserSettingsPage />} />
            <Route path="/admin/edicoes/new" element={<NewEditionPage />} />
            <Route path="/admin/edicoes/:id/edit" element={<NewEditionPage />} />
            
            {/* Rotas originais (mantidas para compatibilidade) */}
            <Route path="/eventos/:slug" element={<EventDetailPage />} />
            <Route path="/eventos/:slug/:ano" element={<EditionDetailPage />} />
            <Route path="/edicoes/:eventoId/:ano" element={<EditionDetailPage />} />
            <Route path="/autores/:slug" element={<AuthorDetailPage />} />
            
            {/* Rotas amigáveis para eventos, edições e autores - devem vir por último */}
            <Route path="/author/:authorId" element={<AuthorDetailPage />} />
            <Route path="/:authorSlug" element={<AuthorDetailPage />} />
            <Route path="/:eventSlug/:year" element={<EditionDetailPage />} />
            <Route path="/:eventSlug" element={<EventDetailPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;