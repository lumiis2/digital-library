import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";

const ImportBibtexPage = ({ onReload }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [articlesPreview, setArticlesPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState("");
  const [edicoes, setEdicoes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar edições disponíveis
    fetch("http://localhost:8000/edicoes")
      .then(res => res.json())
      .then(data => setEdicoes(data))
      .catch(err => console.error("Erro ao carregar edições:", err));
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setShowPreview(false);
    setArticlesPreview([]);
  };

  const processFile = async () => {
    if (!file) {
      alert("Por favor, selecione um arquivo BibTeX");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload-bibtex", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao processar arquivo");
      }

      const data = await response.json();
      setArticlesPreview(data.articles);
      setShowPreview(true);
      setLoading(false);
    } catch (error) {
      alert(`Erro: ${error.message}`);
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!selectedEdition) {
      alert("Por favor, selecione uma edição");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/confirm-bibtex-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articles: articlesPreview,
          edicao_id: parseInt(selectedEdition)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao importar artigos");
      }

      const result = await response.json();
      alert(result.message);
      
      // Recarregar lista de artigos
      if (onReload) {
        onReload();
      }
      
      // Limpar formulário
      setFile(null);
      setArticlesPreview([]);
      setShowPreview(false);
      setSelectedEdition("");
      
      navigate("/articles");
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Processando arquivo BibTeX..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Importação em Massa - BibTeX
          </h1>

          {!showPreview ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo BibTeX
                </label>
                <input
                  type="file"
                  accept=".bib,.bibtex"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Selecione um arquivo .bib ou .bibtex com os dados dos artigos
                </p>
              </div>

              <button
                onClick={processFile}
                disabled={!file}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Processar Arquivo
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-green-800 mb-2">
                  Arquivo processado com sucesso!
                </h2>
                <p className="text-green-700">
                  Encontrados {articlesPreview.length} artigos para importação.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione a Edição
                </label>
                <select
                  value={selectedEdition}
                  onChange={(e) => setSelectedEdition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma edição...</option>
                  {edicoes.map(edicao => (
                    <option key={edicao.id} value={edicao.id}>
                      {edicao.evento_nome} - {edicao.ano}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Preview dos Artigos
                </h3>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {articlesPreview.map((article, index) => (
                    <div
                      key={index}
                      className="p-4 border-b border-gray-200 last:border-b-0"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {article.titulo}
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {article.area && (
                          <p><strong>Área:</strong> {article.area}</p>
                        )}
                        {article.authors.length > 0 && (
                          <p>
                            <strong>Autores:</strong>{" "}
                            {article.authors.map(a => `${a.nome} ${a.sobrenome}`.trim()).join(", ")}
                          </p>
                        )}
                        {article.palavras_chave && (
                          <p><strong>Palavras-chave:</strong> {article.palavras_chave}</p>
                        )}
                        {article.data_publicacao && (
                          <p><strong>Ano:</strong> {article.data_publicacao}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={confirmImport}
                  disabled={!selectedEdition}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Confirmar Importação ({articlesPreview.length} artigos)
                </button>
                
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setArticlesPreview([]);
                    setFile(null);
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportBibtexPage;