import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmailIcon } from '../components/common/Icons';
import { useAuth } from '../components/common/AuthContext';


const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth(); // <-- use o contexto

    const [inputs, setInputs] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    // const [erroPerfil, setErroPerfil] = useState("");
    const [erroLogin, setErroLogin] = useState(""); // novo estado para erros de login

    const handleChange = (e) => {
        setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErroLogin(""); // limpa erro anterior

        setLoading(true);
        try {
            const result = await login(inputs.email, inputs.password);
            if (result.success) {
                navigate("/");
            } else {
                setErroLogin(result.error);
            }
            setInputs({ email: "", password: "" });
        } catch (erro) {
            setErroLogin("Erro de rede ao logar.");
        } finally {
            setLoading(false);
        }
    };

    const inputsDesabilitados = loading;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Faça seu Login</h1>
                        <div className="underline mt-2 w-16 h-1 bg-blue-600 rounded mx-auto"></div>
                        <p className="text-gray-500 mt-3">
                            Acesse sua conta para continuar
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
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
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    value={inputs.password}
                                    onChange={handleChange}
                                    placeholder="Senha"
                                    disabled={inputsDesabilitados}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                        </div>

                        {erroLogin && (
                            <p className="text-red-600 text-sm mt-4">{erroLogin}</p>
                        )}

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Cadastrar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Enviando..." : "Entrar"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 text-right">
                        <button
                            type="button"
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Esqueceu sua senha?
                        </button>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">
                    © {new Date().getFullYear()} Digital Library
                </p>
            </div>
        </div>
    );
};

export default LoginPage;