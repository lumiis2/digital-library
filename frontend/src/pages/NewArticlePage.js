import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const NewArticlePage = () => {
  const [form, setForm] = useState({
    titulo: "",
    pdf_path: "",
    area: "",
    palavras_chave: "",
    edicao_id: "",
    author_ids: [] // precisa existir no JSON enviado
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // garantir que edicao_id seja número
    const payload = {
      ...form,
      edicao_id: parseInt(form.edicao_id, 10),
      author_ids: form.author_ids.length ? form.author_ids : [] // garante lista
    };

    try {
      const res = await fetch("http://localhost:8000/artigos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Erro ao cadastrar artigo");
      }

      await res.json();
      alert("Artigo cadastrado com sucesso!");
      navigate("/my-articles");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-floresta mb-6 text-center">
          Cadastrar Novo Artigo
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
          <input
            name="pdf_path"
            placeholder="Caminho do PDF"
            value={form.pdf_path}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
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
          <input
            name="edicao_id"
            type="number"
            placeholder="ID da Edição"
            value={form.edicao_id}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-floresta text-papel rounded hover:bg-floresta/90 font-semibold"
          >
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewArticlePage;
