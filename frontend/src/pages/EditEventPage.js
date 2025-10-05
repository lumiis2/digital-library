import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditEventPage = () => {
  const { id } = useParams(); // pega o ID da URL
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    sigla: "",
    entidade_promotora: ""
  });
  const [loading, setLoading] = useState(true);

  // Buscar dados do evento ao carregar
  useEffect(() => {
    fetch(`http://localhost:8000/eventos/by-id/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar evento");
        return res.json();
      })
      .then((data) => {
        setForm({
          nome: data.nome || "",
          sigla: data.sigla || "",
          entidade_promotora: data.entidade_promotora || ""
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar evento:", err);
        alert("Erro ao carregar dados do evento: " + err.message);
        navigate("/admin");
      });
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        nome: form.nome.trim(),
        sigla: form.sigla.trim().toUpperCase(),
        entidade_promotora: form.entidade_promotora.trim()
      };
      
      const res = await fetch(`http://localhost:8000/eventos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Erro ao atualizar evento");

      alert("✅ Evento atualizado com sucesso!");
      navigate("/admin"); // volta para dashboard admin
    } catch (err) {
      console.error("Erro ao atualizar evento:", err);
      alert(err.message);
    }
  };

  if (loading) return <p className="text-center mt-10">Carregando...</p>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-floresta mb-6 text-center">
          Editar Evento
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <input
            name="nome"
            placeholder="Nome do Evento"
            value={form.nome}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          {/* Sigla */}
          <input
            name="sigla"
            placeholder="Sigla do Evento (ex: SBES)"
            value={form.sigla}
            onChange={handleChange}
            className="w-full border p-2 rounded uppercase"
            required
          />

          {/* Entidade Promotora */}
          <input
            name="entidade_promotora"
            placeholder="Entidade Promotora (ex: Sociedade Brasileira de Computação)"
            value={form.entidade_promotora}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <button
            type="submit"
            className="w-full px-4 py-2 bg-floresta text-papel rounded hover:bg-floresta/90 font-semibold"
          >
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;
