export const API_BASE_URL = 'http://localhost:8000';

export const apiEndpoints = {
  artigos: '/artigos',
  autores: '/autores',
  eventos: '/eventos',
  edicoes: '/edicoes',
  root: '/'
};

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

// Specific API functions for each endpoint
export const api = {
  // GET requests
  getArtigos: () => fetchData(apiEndpoints.artigos),
  getAutores: () => fetchData(apiEndpoints.autores),
  getEventos: () => fetchData(apiEndpoints.eventos),
  getEdicoes: () => fetchData(apiEndpoints.edicoes),
  
  // POST requests
  createArtigo: async (artigoData) => {
    const response = await fetch(`${API_BASE_URL}${apiEndpoints.artigos}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(artigoData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
  
  createAutor: async (autorData) => {
    const response = await fetch(`${API_BASE_URL}${apiEndpoints.autores}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(autorData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
  
  createEvento: async (eventoData) => {
    const response = await fetch(`${API_BASE_URL}${apiEndpoints.eventos}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventoData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
  
  createEdicao: async (edicaoData) => {
    const response = await fetch(`${API_BASE_URL}${apiEndpoints.edicoes}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(edicaoData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // PUT requests
  updateEvent: async (eventoId, eventoData) => {
    const response = await fetch(`${API_BASE_URL}/eventos/${eventoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventoData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // DELETE requests  
  deleteEvent: async (eventoId) => {
    const response = await fetch(`${API_BASE_URL}/eventos/${eventoId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
};