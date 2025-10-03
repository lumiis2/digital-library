import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const NewArticlePage = ({ onReload }) => {
  const { id } = useParams(); // Para detectar se é edição
  const isEditing = !!id;
  const [form, setForm] = useState({
    titulo: "",
    pdf_path: "",
    area: "",
    palavras_chave: "",
    edicao_id: "",
    author_ids: [] // precisa existir no JSON enviado
  });
  const [edicoes, setEdicoes] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [autorNome, setAutorNome] = useState("");
  const [autores, setAutores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar edições disponíveis
    fetch("http://localhost:8000/edicoes")
      .then(res => res.json())
      .then(data => setEdicoes(data))
      .catch(err => console.error(err));
  }, []);

  // Carregar dados do artigo se for edição
  useEffect(() => {
    if (isEditing) {
      fetch(`http://localhost:8000/artigos/${id}`)
        .then(res => res.json())
        .then(data => {
          setForm({
            titulo: data.titulo || "",
            pdf_path: data.pdf_path || "",
            area: data.area || "",
            palavras_chave: data.palavras_chave || "",
            edicao_id: data.edicao_id || "",
            author_ids: data.authors?.map(a => a.id) || []
          });
          setAutores(data.authors || []);
        })
        .catch(err => console.error(err));
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPdfFile(file);
    if (file) {
      // Definir o caminho onde o arquivo será salvo
      setForm(prev => ({ ...prev, pdf_path: `uploads/${file.name}` }));
    }
  };

  const adicionarAutor = async () => {
    if (!autorNome.trim()) {
      alert("Digite o nome do autor");
      return;
    }

    try {
      // Dividir nome completo em nome e sobrenome
      const nomeCompleto = autorNome.trim().split(' ');
      const nome = nomeCompleto[0];
      const sobrenome = nomeCompleto.slice(1).join(' ') || nome; // Se só há um nome, usar como sobrenome também

      // Criar autor se não existir
      const autorPayload = { nome, sobrenome };
      const autorRes = await fetch("http://localhost:8000/autores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autorPayload)
      });

      if (autorRes.ok) {
        const novoAutor = await autorRes.json();
        setAutores(prev => [...prev, novoAutor]);
        setForm(prev => ({ 
          ...prev, 
          author_ids: [...prev.author_ids, novoAutor.id] 
        }));
        setAutorNome("");
      } else {
        const errorData = await autorRes.json();
        if (errorData.detail?.includes("mesmo nome já está inserido")) {
          alert("Autor já existe no sistema. Tente um nome diferente ou verifique se já foi adicionado.");
        } else {
          alert(errorData.detail || "Erro ao criar autor");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar autor");
    }
  };

  const removerAutor = (autorId) => {
    setAutores(prev => prev.filter(a => a.id !== autorId));
    setForm(prev => ({ 
      ...prev, 
      author_ids: prev.author_ids.filter(id => id !== autorId) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let pdfPath = form.pdf_path;

      // Se há um arquivo selecionado, fazer upload primeiro
      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);

        const uploadRes = await fetch('http://localhost:8000/upload-pdf', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          pdfPath = uploadData.file_path;
        } else {
          throw new Error('Erro ao fazer upload do PDF');
        }
      }

      // Criar ou atualizar o artigo
      const payload = {
        ...form,
        pdf_path: pdfPath,
        edicao_id: parseInt(form.edicao_id, 10),
        author_ids: form.author_ids.length ? form.author_ids : []
      };

      const url = isEditing ? `http://localhost:8000/artigos/${id}` : "http://localhost:8000/artigos";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} artigo`);
      }

      await res.json();
      alert(`Artigo ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
      
      // Recarregar lista de artigos
      if (onReload) {
        onReload();
      }
      
      navigate(isEditing ? "/dashboard" : "/my-articles");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-floresta mb-6 text-center">
          {isEditing ? 'Editar Artigo' : 'Cadastrar Novo Artigo'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="titulo"
            placeholder="Título"
            value={form.titulo}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          
          {/* Seção de Autores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Autores
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Nome completo do autor (ex: João Silva)"
                value={autorNome}
                onChange={(e) => setAutorNome(e.target.value)}
                className="flex-1 border p-2 rounded"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarAutor())}
              />
              <button
                type="button"
                onClick={adicionarAutor}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              ✏️ Digite o nome completo e pressione Enter ou clique em Adicionar
            </p>
            
            {/* Lista de autores adicionados */}
            {autores.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Autores adicionados:</p>
                {autores.map((autor) => (
                  <div key={autor.id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm">{autor.nome}</span>
                    <button
                      type="button"
                      onClick={() => removerAutor(autor.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full border p-2 rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              📄 Selecione um arquivo PDF do seu computador
            </p>
            {form.pdf_path && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Será salvo como: {form.pdf_path}
              </p>
            )}
          </div>
          <input
            name="area"
            placeholder="Área"
            value={form.area}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            name="palavras_chave"
            placeholder="Palavras-chave"
            value={form.palavras_chave}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edição
            </label>
            <select
              name="edicao_id"
              value={form.edicao_id}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Selecione uma edição</option>
              {edicoes.map((edicao) => (
                <option key={edicao.id} value={edicao.id}>
                  Edição {edicao.ano} (ID: {edicao.id})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-floresta text-papel rounded hover:bg-floresta/90 font-semibold"
          >
            {isEditing ? 'Atualizar Artigo' : 'Salvar Artigo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewArticlePage;
