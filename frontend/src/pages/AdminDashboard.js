import React, { useEffect } from "react";
import { useAuth } from "../components/common/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const AdminDashboard = ({ 
  artigos = [], // CORREÇÃO: Valor padrão
  eventos = [], // CORREÇÃO: Valor padrão
  edicoes = [], // CORREÇÃO: Valor padrão
  onReloadArtigos, 
  onReloadEventos, 
  onReloadEdicoes 
}) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/"); // 🚨 redireciona se não for admin
      return;
    }
  }, [isAdmin, navigate]);

  // Mostrar mensagem de sucesso se houver
  useEffect(() => {
    if (location.state?.message) {
      alert(location.state.message);
      // Limpar o state para não mostrar a mensagem novamente
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // CORREÇÃO: Verificar se os dados são arrays válidos
  const artigosArray = Array.isArray(artigos) ? artigos : [];
  const eventosArray = Array.isArray(eventos) ? eventos : [];
  const edicoesArray = Array.isArray(edicoes) ? edicoes : [];

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
      if (onReloadArtigos) onReloadArtigos();
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
        let errorMessage = "Erro ao excluir evento";
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (parseError) {
          // Se não conseguir parsear, usar mensagem genérica
        }
        throw new Error(errorMessage);
      }

      // Recarrega a lista de eventos
      if (onReloadEventos) onReloadEventos();
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
        let errorMessage = "Erro ao excluir edição";
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (parseError) {
          // Se não conseguir parsear, usar mensagem genérica
        }
        throw new Error(errorMessage);
      }

      // Recarrega a lista de edições
      if (onReloadEdicoes) onReloadEdicoes();
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
              onClick={() => navigate("/admin/articles/new")}
              className="px-5 py-2 bg-douradoSol text-papel rounded-lg shadow hover:bg-douradoSol/90 font-semibold transition"
            >
              + Cadastrar Artigo
            </button>
          </div>

          {artigosArray.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
              <p className="text-gray-600">Nenhum artigo cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {artigosArray.map((article) => (
                <div
                  key={article.id}
                  className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg text-floresta mb-2">
                    {article.titulo}
                  </h3>
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Área:</span> {article.area || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    <span className="font-semibold">Palavras-chave:</span>{" "}
                    {article.palavras_chave || "N/A"}
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
              onClick={() => navigate("/admin/events/new")}
              className="px-5 py-2 bg-douradoSol text-papel rounded-lg shadow hover:bg-douradoSol/90 font-semibold transition"
            >
              + Cadastrar Evento
            </button>
          </div>

          {eventosArray.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
              <p className="text-gray-600">Nenhum evento cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {eventosArray.map((event) => (
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

          {edicoesArray.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
              <p className="text-gray-600">Nenhuma edição cadastrada ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {edicoesArray.map((edition) => {
                const evento = eventosArray.find(e => e.id === edition.evento_id);
                return (
                  <div
                    key={edition.id}
                    className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition"
                  >
                    <h3 className="font-bold text-lg text-floresta mb-2">
                      Edição {edition.ano}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold">Evento:</span> {
                        evento?.nome || `ID ${edition.evento_id}`
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
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
