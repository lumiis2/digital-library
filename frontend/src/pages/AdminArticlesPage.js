import React, { useEffect } from "react";
import { useAuth } from "../components/common/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminArticlesPage = ({ artigos = [], onReload }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Filtrar artigos do usuário atual
  const userArticles = artigos.filter(artigo => 
    artigo.authors && artigo.authors.some(author => author.id === user?.id)
  );

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/"); // 🚨 redireciona se não for admin
      return;
    }

    // Recarregar artigos se necessário
    if (onReload) {
      onReload();
    }
  }, [user, isAdmin, navigate, onReload]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-floresta mb-4">
        Meus Artigos (Admin)
      </h2>

      <button
        onClick={() => navigate("/admin/articles")}
        className="mb-4 px-4 py-2 bg-douradoSol text-papel rounded shadow hover:bg-douradoSol/90"
      >
        + Cadastrar Novo Artigo
      </button>

      <ul className="space-y-3">
        {userArticles.map(article => (
          <li
            key={article.id}
            className="p-4 bg-papel border border-madeira rounded shadow"
          >
            <h3 className="font-semibold text-lg">{article.titulo}</h3>
            <p className="text-sm text-gray-600">
              Área: {article.area} | Palavras-chave: {article.palavras_chave}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminArticlesPage;
