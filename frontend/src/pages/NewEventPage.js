import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/common/AuthContext";

const NewEventPage = () => {
  const [form, setForm] = useState({
    nome: "",
    sigla: "",
    entidade_promotora: ""
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Monta o payload com os dados do formulário + admin_id
      const eventData = {
        nome: form.nome.trim(),
        sigla: form.sigla.trim().toUpperCase(), // 👈 força sigla em maiúsculas
        entidade_promotora: form.entidade_promotora.trim(),
        admin_id: user?.id
      };

      const res = await fetch("http://localhost:8000/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Erro ao cadastrar evento");
      }

      await res.json();
      alert("✅ Evento cadastrado com sucesso!");
      navigate("/events");
    } catch (err) {
      console.error("Erro ao salvar evento:", err);
      alert(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-floresta mb-6 text-center">
          Cadastrar Novo Evento
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nome do evento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Evento *
            </label>
            <input
              name="nome"
              placeholder="Ex: Simpósio Brasileiro de Engenharia de Software"
              value={form.nome}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          {/* Sigla */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sigla do Evento *
            </label>
            <input
              name="sigla"
              placeholder="Ex: SBES"
              value={form.sigla}
              onChange={handleChange}
              className="w-full border p-2 rounded uppercase"
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use letras maiúsculas (ex: SBES, SBCARS)
            </p>
          </div>

          {/* Entidade Promotora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entidade Promotora *
            </label>
            <input
              name="entidade_promotora"
              placeholder="Ex: Sociedade Brasileira de Computação (SBC)"
              value={form.entidade_promotora}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          {/* Botão de envio */}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-floresta text-papel rounded hover:bg-floresta/90 font-semibold"
          >
            Salvar Evento
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewEventPage;
