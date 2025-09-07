import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmailIcon } from '../components/common/Icons';

const LoginPage = () => {
    //const navigate = useNavigate();
    const [inputs, setInputs] = useState({ nome: "", email: "", senha_hash: "" });
    const [perfil, setPerfil] = useState(""); // "admin" | "usuario"
    const [loading, setLoading] = useState(false);
    const [erroPerfil, setErroPerfil] = useState("");

    const handleChange = (e) => {
        setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!perfil) {
            setErroPerfil("Selecione um perfil para continuar.");
            return;
        }

        setErroPerfil("");
        setLoading(true);
        try {
            const resposta = await fetch("http://127.0.0.1:8000/usuarios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome: inputs.nome,
                    email: inputs.email,
                    senha_hash: inputs.senha_hash,
                    perfil, // envia o perfil escolhido
                }),
            });

            const data = await resposta.json();
            alert(`Usuário criado! ID: ${data.id}`);

            // opcional: limpar
            setInputs({ nome: "", email: "", senha_hash: "" });
            setPerfil("");
        } catch (erro) {
            alert("Erro de rede ao cadastrar.");
        } finally {
            setLoading(false);
        }
    };

    const inputsDesabilitados = !perfil || loading;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Faça seu Login</h1>
                        <div className="underline mt-2 w-16 h-1 bg-blue-600 rounded mx-auto"></div>
                        <p className="text-gray-500 mt-3">
                            Acesse sua conta para continuar
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Seleção de Perfil */}
                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-2">Selecione seu perfil</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPerfil("usuario")}
                                    className={`rounded-lg border px-4 py-2.5 text-sm transition
                    ${perfil === "usuario"
                                            ? "border-blue-600 bg-blue-50 text-blue-700"
                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    Usuário
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPerfil("admin")}
                                    className={`rounded-lg border px-4 py-2.5 text-sm transition
                    ${perfil === "admin"
                                            ? "border-blue-600 bg-blue-50 text-blue-700"
                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    Administrador
                                </button>
                            </div>
                            {erroPerfil && (
                                <p className="text-red-600 text-sm mt-2">{erroPerfil}</p>
                            )}
                            {!perfil && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Escolha um perfil para habilitar os campos de login.
                                </p>
                            )}
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4">
                            {/* Usuário */}
                            <div className="relative">
                                <input
                                    type="text"
                                    name="nome"
                                    value={inputs.nome}
                                    onChange={handleChange}
                                    placeholder="Usuário"
                                    disabled={inputsDesabilitados}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>

                            {/* Email */}
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
                                    disabled={inputsDesabilitados}
                                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>

                            {/* Senha */}
                            <div className="relative">
                                <input
                                    type="password"
                                    name="senha_hash"
                                    value={inputs.senha_hash}
                                    onChange={handleChange}
                                    placeholder="Senha"
                                    disabled={inputsDesabilitados}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex items-center gap-3">
                            <button
                                type="button"
                                //onClick={() => navigate('register')}
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            // onClick={() => ...} // ação de cadastro futura
                            >
                                Cadastrar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !perfil}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Enviando..." : "Entrar"}
                            </button>
                        </div>
                    </form>

                    {/* Forgot password */}
                    <div className="mt-4 text-right">
                        <button
                            type="button"
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Esqueceu sua senha?
                        </button>
                    </div>
                </div>

                {/* Rodapé opcional */}
                <p className="text-center text-xs text-gray-500 mt-4">
                    © {new Date().getFullYear()} Digital Library
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
