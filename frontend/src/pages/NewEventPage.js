import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/common/AuthContext";

const NewEventPage = () => {
  const [form, setForm] = useState({
    nome: "",
    sigla: ""
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Incluir admin_id no payload
      const eventData = {
        ...form,
        admin_id: user?.id // Adiciona o ID do usuário logado
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
      alert("Evento cadastrado com sucesso!");
      navigate("/events"); // volta para a lista de eventos
    } catch (err) {
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
          <input
            name="nome"
            placeholder="Nome do Evento"
            value={form.nome}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            name="sigla"
            placeholder="Sigla do Evento (ex: SBES)"
            value={form.sigla}
            onChange={handleChange}
            className="w-full border p-2 rounded"
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

export default NewEventPage;
