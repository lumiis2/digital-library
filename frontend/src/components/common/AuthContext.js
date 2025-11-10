import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Debug: loga o perfil do usuário sempre que user mudar
  useEffect(() => {
    if (user) {
      console.log('[AuthContext] user.perfil:', user.perfil, user);
    }
  }, [user]);
  const [loading, setLoading] = useState(true);

  // Recupera usuário ao carregar a aplicação
  useEffect(() => {
    const token = localStorage.getItem('authToken');  // MUDANÇA: 'authToken'
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('authToken');  // MUDANÇA: 'authToken'
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // 🔹 Login
  const login = async (email, password) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      setUser(data);
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(data));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🔹 Registro
  const register = async (userData) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/usuarios/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      return { success: true, message: 'Usuário criado com sucesso' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem('authToken');  // MUDANÇA: 'authToken'
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => user?.perfil === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAdmin,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
