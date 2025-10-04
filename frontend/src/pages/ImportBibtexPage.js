import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";

const ImportBibtexPage = ({ onReload }) => {
  const [file, setFile] = useState(null);
  const [pdfZip, setPdfZip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [articlesPreview, setArticlesPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setShowPreview(false);
    setArticlesPreview([]);
    setRelatorio(null);
  };

  const handlePdfZipChange = (e) => {
    setPdfZip(e.target.files[0]);
  };

  const processFile = async () => {
    if (!file) {
      alert("Por favor, selecione um arquivo BibTeX");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    
    // Obter token do localStorage
    const token = localStorage.getItem('authToken');
    
    // Usar o endpoint unificado /upload-bibtex
    formData.append("bibtex_file", file);
    
    if (pdfZip) {
      // Modo: Salvar automaticamente com PDFs
      formData.append("pdf_zip", pdfZip);
      formData.append("action", "save");
      // REMOVER: formData.append("authorization", token); - Não vai no FormData
    
      try {
        const response = await fetch("http://localhost:8000/upload-bibtex", {
          method: "POST",
          headers: {
            // ADICIONAR: Token vai no header, não no FormData
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erro ao processar arquivo");
        }

        const data = await response.json();
        setRelatorio(data.relatorio);
        
        // Recarregar lista de artigos
        if (onReload) {
          onReload();
        }
        
        // Limpar formulário
        setFile(null);
        setPdfZip(null);
        
        alert(`Processamento concluído! ${data.relatorio.cadastrados} artigos cadastrados.`);
        
      } catch (error) {
        alert(`Erro: ${error.message}`);
      }
    } else {
      // Modo: Preview (sem PDFs)
      formData.append("action", "preview");
      
      try {
        const response = await fetch("http://localhost:8000/upload-bibtex", {
          method: "POST",
          headers: {
            // Token no header também para preview (opcional)
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Erro ao processar arquivo");
        }

        const data = await response.json();
        setArticlesPreview(data.articles);
        setShowPreview(true);
      } catch (error) {
        alert(`Erro: ${error.message}`);
      }
    }
    
    setLoading(false);
  };

  const confirmImport = async () => {
    setLoading(true);

    try {
      // Obter token do localStorage
      const token = localStorage.getItem('authToken');
      
      // Usar o endpoint unificado para salvar o preview
      const formData = new FormData();
      formData.append("bibtex_file", file);
      formData.append("action", "save");
      // REMOVER: formData.append("authorization", token); - Não vai no FormData

      const response = await fetch("http://localhost:8000/upload-bibtex", {
        method: "POST",
        headers: {
          // ADICIONAR: Token vai no header
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao importar artigos");
      }

      const result = await response.json();
      
      if (result.relatorio) {
        // Mostrar relatório
        setRelatorio(result.relatorio);
        alert(`Importação concluída! ${result.relatorio.cadastrados} artigos salvos.`);
      } else {
        alert("Importação concluída com sucesso!");
      }
      
      // Recarregar lista de artigos
      if (onReload) {
        onReload();
      }
      
      // Limpar preview
      setArticlesPreview([]);
      setShowPreview(false);
      
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

          {/* Informações sobre como usar */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Como funciona:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Sem PDFs:</strong> Selecione apenas o arquivo .bib para ver preview dos artigos</li>
              <li>• <strong>Com PDFs:</strong> Selecione o arquivo .bib + um .zip com os PDFs (cadastro automático)</li>
              <li>• O sistema identifica automaticamente eventos e edições pelo booktitle e year</li>
              <li>• Os PDFs devem ter o mesmo nome do ID do BibTeX (ex: sbes-paper1.pdf)</li>
              <li>• Campos obrigatórios: title, author (+ booktitle, year se usando PDFs)</li>
            </ul>
          </div>

          {!showPreview && !relatorio ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📄 Arquivo BibTeX
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📦 Arquivo ZIP com PDFs (opcional)
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handlePdfZipChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Se selecionado, os artigos serão cadastrados automaticamente com os PDFs
                </p>
              </div>

              <button
                onClick={processFile}
                disabled={!file}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {pdfZip ? "🚀 Processar e Cadastrar com PDFs" : "📋 Processar e Visualizar Preview"}
              </button>
            </div>
          ) : relatorio ? (
            /* Relatório de processamento */
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  📊 Relatório do Processamento
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-blue-600">{relatorio.processados}</div>
                    <div className="text-sm text-blue-800">Processados</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-green-600">{relatorio.cadastrados}</div>
                    <div className="text-sm text-green-800">Cadastrados</div>
                  </div>
                </div>

                {/* Mostrar edições criadas */}
                {relatorio.edicoes_criadas && relatorio.edicoes_criadas.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded">
                    <h4 className="font-medium text-green-700 mb-2">
                      ✨ Eventos/Edições Criados ({relatorio.edicoes_criadas.length}):
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {relatorio.edicoes_criadas.map((item, index) => (
                        <li key={index} className="text-sm text-green-800">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {relatorio.pulados && relatorio.pulados.length > 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 rounded">
                    <h4 className="font-medium text-yellow-700 mb-2">
                      ⚠️ Artigos Pulados ({relatorio.pulados.length}):
                    </h4>
                    <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                      {relatorio.pulados.map((item, index) => (
                        <li key={index} className="text-sm text-yellow-800">
                          <strong>{item.id}:</strong> {item.motivo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {relatorio.erros && relatorio.erros.length > 0 && (
                  <div className="p-4 bg-red-50 rounded">
                    <h4 className="font-medium text-red-700 mb-2">
                      ❌ Erros ({relatorio.erros.length}):
                    </h4>
                    <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                      {relatorio.erros.map((item, index) => (
                        <li key={index} className="text-sm text-red-800">
                          <strong>{item.id}:</strong> {item.erro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setRelatorio(null);
                    setFile(null);
                    setPdfZip(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ✨ Nova Importação
                </button>
                
                <button
                  onClick={() => navigate("/articles")}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  📚 Ver Artigos
                </button>
              </div>
            </div>
          ) : (
            /* Preview original */
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-green-800 mb-2">
                  Arquivo processado com sucesso!
                </h2>
                <p className="text-green-700">
                  Encontrados {articlesPreview.length} artigos para importação.
                </p>
                <p className="text-sm text-green-600 mt-2">
                  ℹ️ O sistema identificará automaticamente eventos e edições baseado no booktitle e year de cada artigo.
                </p>
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
                        {article.booktitle && (
                          <p><strong>Evento:</strong> {article.booktitle}</p>
                        )}
                        {article.data_publicacao && (
                          <p><strong>Ano:</strong> {article.data_publicacao}</p>
                        )}
                        {article.area && (
                          <p><strong>Área:</strong> {article.area}</p>
                        )}
                        {article.authors && article.authors.length > 0 && (
                          <p>
                            <strong>Autores:</strong>{" "}
                            {article.authors.map(a => `${a.nome} ${a.sobrenome}`.trim()).join(", ")}
                          </p>
                        )}
                        {article.palavras_chave && (
                          <p><strong>Palavras-chave:</strong> {article.palavras_chave}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={confirmImport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar Importação ({articlesPreview.length} artigos)
                </button>
                
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setArticlesPreview([]);
                    setFile(null);
                    setPdfZip(null);
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