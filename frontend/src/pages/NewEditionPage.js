import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function NewEditionPage() {
  const [ano, setAno] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams(); // para edição

  useEffect(() => {
    // Buscar eventos
    fetch("http://localhost:8000/eventos")
      .then(res => res.json())
      .then(data => setEventos(data))
      .catch(err => console.error(err));

    // Se for edição, buscar dados
    if (id) {
      fetch(`http://localhost:8000/edicoes/${id}`)
        .then(res => res.json())
        .then(data => {
          setAno(data.ano);
          setEventoId(data.evento_id);
        })
        .catch(err => console.error(err));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validação simples
    if (!ano || !eventoId) {
      setError('Preencha todos os campos');
      return;
    }
    if (ano < 1900 || ano > 2100) {
      setError('Ano inválido');
      return;
    }

    setLoading(true);

    const payload = { ano, evento_id: eventoId };
    const method = id ? 'PUT' : 'POST';
    const url = id 
      ? `http://localhost:8000/edicoes/${id}`
      : 'http://localhost:8000/edicoes';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Edição ${id ? 'atualizada' : 'criada'} com sucesso!`);
        navigate('/dashboard');
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Erro ao salvar edição');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm("Deseja realmente deletar esta edição?");
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:8000/edicoes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Edição deletada!');
        navigate('/dashboard');
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Erro ao deletar');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">{id ? 'Editar Edição' : 'Nova Edição'}</h2>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <label>
          Ano:git
          <input 
            type="number" 
            value={ano} 
            onChange={e => setAno(e.target.value)} 
            className="border p-2 w-full"
            required
          />
        </label>

        <label>
          Evento:
          <select
            value={eventoId}
            onChange={e => setEventoId(e.target.value)}
            className="border p-2 w-full"
            required
          >
            <option value="">Selecione um evento</option>
            {eventos.map(evt => (
              <option key={evt.id} value={evt.id}>{evt.nome}</option>
            ))}
          </select>
        </label>

        <button 
          type="submit" 
          className={`bg-blue-500 text-white py-2 px-4 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Processando...' : (id ? 'Salvar Alterações' : 'Criar Edição')}
        </button>

        {id && (
          <button 
            type="button" 
            onClick={handleDelete} 
            className="bg-red-500 text-white py-2 px-4 rounded"
          >
            Deletar Edição
          </button>
        )}
      </form>
    </div>
  );
}

export default NewEditionPage;