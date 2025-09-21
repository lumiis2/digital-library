import React, { useEffect, useState } from "react";
import { useAuth } from "../components/common/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminArticlesPage = () => {
  const { user, isAdmin } = useAuth();
  const [articles, setArticles] = useState([]);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/"); // 🚨 redireciona se não for admin
      return;
    }

    // Buscar artigos do admin
    fetch(`http://localhost:8000/artigos?autor_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => setArticles(data))
      .catch((err) => console.error(err));

    // Buscar eventos
    fetch("http://localhost:8000/eventos")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error(err));
  }, [user, isAdmin, navigate]);

  // Função para excluir artigo
  const handleDeleteArticle = async (id) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este artigo?"
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:8000/artigos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir artigo");
      }

      // Remove o artigo do estado
      setArticles((prev) => prev.filter((a) => a.id !== id));
      alert("Artigo excluído com sucesso!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Seção de Artigos */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-floresta">
              Gerenciar Artigos
            </h2>
            <button
              onClick={() => navigate("/admin/articles")}
              className="px-5 py-2 bg-douradoSol text-papel rounded-lg shadow hover:bg-douradoSol/90 font-semibold transition"
            >
              + Cadastrar Artigo
            </button>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
              <p className="text-gray-600">Nenhum artigo cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg text-floresta mb-2">
                    {article.titulo}
                  </h3>
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Área:</span> {article.area}
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    <span className="font-semibold">Palavras-chave:</span>{" "}
                    {article.palavras_chave}
                  </p>

                  <button
                    onClick={() => handleDeleteArticle(article.id)}
                    className="px-4 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 transition text-sm"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seção de Eventos */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-floresta">
              Gerenciar Eventos
            </h2>
            <button
              onClick={() => navigate("/admin/events")}
              className="px-5 py-2 bg-douradoSol text-papel rounded-lg shadow hover:bg-douradoSol/90 font-semibold transition"
            >
              + Cadastrar Evento
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
              <p className="text-gray-600">Nenhum evento cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg text-floresta mb-2">
                    {event.nome}
                  </h3>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Sigla:</span> {event.slug}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminArticlesPage;
