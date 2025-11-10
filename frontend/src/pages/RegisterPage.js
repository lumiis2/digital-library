// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { EmailIcon } from "../components/common/Icons";

const RegisterPage = () => {
  const [perfil, setPerfil] = useState(""); // "usuario" | "admin"
  const [inputs, setInputs] = useState({
    nome: "",
    email: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!perfil) {
      setErro("Selecione um perfil.");
      return;
    }

    if (!inputs.nome || !inputs.email || !inputs.senha) {
      setErro("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const url = "http://127.0.0.1:8000/usuarios/";

      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: inputs.nome,
          email: inputs.email,
          senha_hash: inputs.senha,
          perfil,
          receive_notifications: true,
        }),
      });

      if (!resposta.ok) {
        const data = await resposta.json();
        throw new Error(data.detail || "Falha no cadastro.");
      }

      const data = await resposta.json();
      alert("Cadastro realizado com sucesso!");
      setInputs({ nome: "", email: "", senha: "" });
      setPerfil("");
    } catch (err) {
      setErro(err.message || "Erro de rede ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Cadastro</h1>
            <div className="underline mt-2 w-16 h-1 bg-blue-600 rounded mx-auto"></div>
            <p className="text-gray-500 mt-3">Crie sua conta</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Seleção de Perfil */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selecione seu perfil
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPerfil("usuario")}
                  className={`rounded-lg border px-4 py-2.5 text-sm transition ${
                    perfil === "usuario"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Usuário
                </button>
                <button
                  type="button"
                  onClick={() => setPerfil("admin")}
                  className={`rounded-lg border px-4 py-2.5 text-sm transition ${
                    perfil === "admin"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Administrador
                </button>
              </div>
              {!perfil && (
                <p className="text-xs text-gray-500 mt-2">
                  Escolha um perfil para continuar.
                </p>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  name="nome"
                  value={inputs.nome}
                  onChange={handleChange}
                  placeholder="Nome"
                  disabled={disabled}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <EmailIcon className="w-5 h-5 text-gray-400" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={inputs.email}
                  onChange={handleChange}
                  placeholder="Email"
                  disabled={disabled}
                  className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  name="senha"
                  value={inputs.senha}
                  onChange={handleChange}
                  placeholder="Senha"
                  disabled={disabled}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            {erro && <p className="text-red-600 text-sm mt-4">{erro}</p>}

            <div className="mt-6">
              <button
                type="submit"
                disabled={disabled || !perfil}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Cadastrando..." : "Criar conta"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          © {new Date().getFullYear()} Digital Library
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
