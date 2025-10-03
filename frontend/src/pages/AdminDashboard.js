import React, { useEffect, useState } from "react";
import { useAuth } from "../components/common/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = ({ 
  artigos, 
  eventos, 
  edicoes, 
  onReloadArtigos, 
  onReloadEventos, 
  onReloadEdicoes 
}) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/"); // 🚨 redireciona se não for admin
      return;
    }
  }, [isAdmin, navigate]);

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

      // Recarrega a lista de artigos
      onReloadArtigos();
      alert("Artigo excluído com sucesso!");
    } catch (err) {
      alert(err.message);
    }
  };

  // Função para excluir evento
  const handleDeleteEvent = async (id) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este evento?"
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:8000/eventos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir evento");
      }

      // Recarrega a lista de eventos
      onReloadEventos();
      alert("Evento excluído com sucesso!");
    } catch (err) {
      alert(err.message);
    }
  };

  // Função para excluir edição
  const handleDeleteEdition = async (id) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta edição?"
    );
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:8000/edicoes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir edição");
      }

      // Recarrega a lista de edições
      onReloadEdicoes();
      alert("Edição excluída com sucesso!");
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

          {artigos.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
              <p className="text-gray-600">Nenhum artigo cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {artigos.map((article) => (
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

                  <div className="flex space-x-2">
                    {/* Botão de editar artigo */}
                    <button
                      onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                      className="px-4 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition text-sm"
                    >
                      Editar
                    </button>

                    {/* Botão de excluir artigo */}
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="px-4 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 transition text-sm"
                    >
                      Excluir
                    </button>
                  </div>
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

          {eventos.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
              <p className="text-gray-600">Nenhum evento cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {eventos.map((event) => (
                <div
                  key={event.id}
                  className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg text-floresta mb-2">
                    {event.nome}
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Sigla:</span> {event.slug}
                  </p>

                  <div className="flex space-x-2">
                    {/* Botão de editar evento */}
                    <button
                      onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                      className="px-4 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition text-sm"
                    >
                      Editar
                    </button>

                    {/* Botão de excluir evento */}
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-4 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 transition text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seção de Edições */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-floresta">
              Gerenciar Edições
            </h2>
            <button
              onClick={() => navigate("/admin/edicoes/new")}
              className="px-5 py-2 bg-douradoSol text-papel rounded-lg shadow hover:bg-douradoSol/90 font-semibold transition"
            >
              + Cadastrar Edição
            </button>
          </div>

          {edicoes.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
              <p className="text-gray-600">Nenhuma edição cadastrada ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {edicoes.map((edition) => (
                <div
                  key={edition.id}
                  className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg text-floresta mb-2">
                    Edição {edition.ano}
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Evento:</span> {
                      eventos.find(e => e.id === edition.evento_id)?.nome || `ID ${edition.evento_id}`
                    }
                  </p>

                  <div className="flex space-x-2">
                    {/* Botão de editar edição */}
                    <button
                      onClick={() => navigate(`/admin/edicoes/${edition.id}/edit`)}
                      className="px-4 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition text-sm"
                    >
                      Editar
                    </button>

                    {/* Botão de excluir edição */}
                    <button
                      onClick={() => handleDeleteEdition(edition.id)}
                      className="px-4 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 transition text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
