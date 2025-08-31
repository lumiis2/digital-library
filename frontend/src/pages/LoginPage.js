import React from "react";
import { EmailIcon } from '../components/common/Icons';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Login</h1>
            <div className="underline mt-2 w-16 h-1 bg-blue-600 rounded mx-auto"></div>
            <p className="text-gray-500 mt-3">
              Acesse sua conta para continuar
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            {/* Usuário */}
            <div className="relative">
              <input
                type="text"
                placeholder="Usuário"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                {/* Se EmailIcon for um componente React (SVG) */}
                <EmailIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Senha */}
            <div className="relative">
              <input
                type="password"
                placeholder="Senha"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Forgot password */}
          <div className="mt-4 text-right">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Esqueceu sua senha?
            </button>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cadastrar
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Entrar
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
