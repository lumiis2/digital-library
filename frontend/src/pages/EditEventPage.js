import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditEventPage = () => {
  const { id } = useParams(); // ID da URL
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    sigla: "",
    entidade_promotora: "",
  });
  const [loading, setLoading] = useState(true);

  // 🔹 Buscar dados do evento ao carregar
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:8000/eventos/by-id/${id}`);
        if (!res.ok) throw new Error("Erro ao buscar evento");
        const data = await res.json();

        setForm({
          nome: data.nome || "",
          // backend normalmente retorna o identificador como `slug`
          sigla: (data.slug || data.sigla || "").toUpperCase(),
          entidade_promotora: data.entidade_promotora || "",
        });
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
        alert("Erro ao carregar dados do evento: " + err.message);
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  // 🔹 Atualiza o formulário conforme digitação
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 🔹 Envia atualização ao backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        nome: form.nome.trim(),
        sigla: form.sigla.trim().toUpperCase(),
      };
      if (form.entidade_promotora && form.entidade_promotora.trim() !== "") {
        updateData.entidade_promotora = form.entidade_promotora.trim();
      }

      const res = await fetch(`http://localhost:8000/eventos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Erro ao atualizar evento");

      alert("✅ Evento atualizado com sucesso!");
      navigate("/admin");
    } catch (err) {
      console.error("Erro ao atualizar evento:", err);
      alert(err.message);
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-600">Carregando dados do evento...</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 flex items-start">
      <div className="w-full max-w-3xl mx-auto bg-white shadow rounded-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-floresta mb-6 text-center">Editar Evento</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex: Simpósio Brasileiro de Engenharia de Software"
                className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-floresta/60"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sigla</label>
              <input
                name="sigla"
                value={form.sigla}
                onChange={handleChange}
                placeholder="Ex: SBES"
                className="w-full border p-3 rounded-md uppercase focus:outline-none focus:ring-2 focus:ring-floresta/60"
                required
              />
              <p className="text-xs text-gray-500 mt-1">A sigla será usada como identificador do evento.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entidade Promotora</label>
            <input
              name="entidade_promotora"
              value={form.entidade_promotora}
              onChange={handleChange}
              placeholder="Ex: Sociedade Brasileira de Computação"
              className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-floresta/60"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-50"
            >
              Voltar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-floresta text-papel rounded-md font-semibold hover:bg-floresta/90 shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;
