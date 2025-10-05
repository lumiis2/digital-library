import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // <-- adicione useNavigate
import Navigation from './components/common/Navigation';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import AuthorsPage from './pages/AuthorsPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminArticlesPage from './pages/AdminArticlesPage';
import NewArticlePage from './pages/NewArticlePage';  
import AdminDashboard from './pages/AdminDashboard';
import AdminPanel from './pages/AdminPanel';
import ImportBibtexPage from './pages/ImportBibtexPage';
import backgroundImage from './assets/background.png';
import NewEventPage from './pages/NewEventPage';
import EditEventPage from './pages/EditEventPage';
import EventDetailPage from './pages/EventDetailPage';
import EditionDetailPage from './pages/EditionDetailPage';
import AuthorDetailPage from './pages/AuthorDetailPage';
import UserSettingsPage from './pages/UserSettingsPage';
import NewEditionPage from './pages/NewEditionPage';
import EditionsPage from './pages/EditionsPage';

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
    fetch("http://localhost:8000/eventos")
      .then(res => res.json())
      .then(data => { setEventos(data); setLoadingEventos(false); })
      .catch(() => setLoadingEventos(false));
  }, []);

  const reloadEdicoes = useCallback(() => {
    fetch("http://localhost:8000/edicoes")
      .then(res => res.json())
      .then(data => { setEdicoes(data); setLoadingEdicoes(false); })
      .catch(() => setLoadingEdicoes(false));
  }, []);

  const reloadArtigos = useCallback(() => {
    console.log("Recarregando artigos...");
    fetch("http://localhost:8000/artigos")
      .then(res => {
        console.log("Resposta reload artigos:", res.status);
        return res.json();
      })
      .then(data => { 
        console.log("Artigos recarregados:", data);
        setArtigos(data); 
        setLoading(false); 
      })
      .catch(error => {
        console.error("Erro ao recarregar artigos:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    console.log("Carregando artigos...");
    fetch("http://localhost:8000/artigos")
      .then(res => {
        console.log("Resposta do backend:", res.status);
        return res.json();
      })
      .then(data => { 
        console.log("Artigos carregados:", data);
        setArtigos(data); 
        setLoading(false); 
      })
      .catch(error => {
        console.error("Erro ao carregar artigos:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/autores")
      .then(res => res.json())
      .then(data => { setAutores(data); setLoadingAutores(false); })
      .catch(() => setLoadingAutores(false));
  }, []);

  useEffect(() => {
    reloadEventos();
  }, [reloadEventos]);

  useEffect(() => {
    reloadEdicoes();
  }, [reloadEdicoes]);

  

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
            
            {/* ROTAS FIXAS PRIMEIRO - MUITO IMPORTANTE A ORDEM */}
            <Route path="/articles" element={<ArticlesPage artigos={artigos} loading={loadingArtigos} />} />
            <Route path="/authors" element={<AuthorsPage data={autores} loading={loadingAutores} />} />
            <Route path="/events" element={<EventsPage data={eventos} loading={loadingEventos} onReload={reloadEventos} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/configuracoes" element={<UserSettingsPage />} />
            
            {/* ROTAS ADMIN */}
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/articles" element={<AdminArticlesPage artigos={artigos} onReload={reloadArtigos} />} />
            <Route path="/admin/articles/new" element={<NewArticlePage onReload={reloadArtigos} />} />
            <Route path="/admin/articles/:id/edit" element={<NewArticlePage onReload={reloadArtigos} />} />
            <Route path="/admin/events" element={<EventsPage data={eventos} loading={loadingEventos} onReload={reloadEventos} />} />
            <Route path="/admin/events/new" element={<NewEventPage />} />
            <Route path="/admin/events/:id/edit" element={<EditEventPage/>} />
            <Route path="/admin/edicoes/new" element={<NewEditionPage />} />
            <Route path="/admin/edicoes/:id/edit" element={<NewEditionPage />} />
            <Route path="/admin/import-bibtex" element={<ImportBibtexPage onReload={reloadArtigos} />} />
            
            {/* DASHBOARD */}
            <Route path="/dashboard" element={<AdminDashboard 
                  eventos={eventos} 
                  edicoes={edicoes} 
                  artigos={artigos}
                  onReloadEventos={reloadEventos}
                  onReloadEdicoes={reloadEdicoes}
                  onReloadArtigos={reloadArtigos}
                />} />
            
            {/* ROTAS ESPECÍFICAS COM PARÂMETROS - ORDEM CRÍTICA */}
            <Route path="/eventos/:slug" element={<EventDetailPage />} />
            <Route path="/eventos/:slug/:ano" element={<EditionDetailPage />} />
            <Route path="/autores/:slug" element={<AuthorDetailPage />} />
            <Route path="/author/:authorId" element={<AuthorDetailPage />} />
            <Route path="/edicoes/:eventoId/:ano" element={<EditionDetailPage />} />
            <Route path="/editions" element={<EditionsPage data={edicoes} loading={loadingEdicoes} onReload={reloadEdicoes} />} />
            
            {/* ROTAS DINÂMICAS POR ÚLTIMO - ESTAS SÃO FALLBACK */}
            <Route path="/:eventSlug/:year" element={<EditionDetailPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;