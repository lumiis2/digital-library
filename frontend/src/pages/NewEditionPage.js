import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function NewEditionPage() {
  const [ano, setAno] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [eventos, setEventos] = useState([]);
  const navigate = useNavigate();

  // Para edição
  const { id } = useParams(); // se for /edicoes/:id/edit

  useEffect(() => {
    // Buscar todos os eventos para popular o select
    fetch("http://localhost:8000/eventos")
      .then(res => res.json())
      .then(data => setEventos(data))
      .catch(err => console.error(err));
    
    // Se estiver editando, buscar dados da edição
    if (id) {
      fetch(`http://localhost:8000/edicoes/${id}`)
        .then(res => res.json())
        .then(data => {
          setAno(data.ano);
          setEventoId(data.evento_id);
        });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ano, evento_id: eventoId };

    const method = id ? 'PUT' : 'POST';
    const url = id 
      ? `http://localhost:8000/edicoes/${id}`
      : 'http://localhost:8000/edicoes';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert('Edição salva com sucesso!');
      navigate('/editions'); // volta para a lista de edições
    } else {
      const error = await res.json();
      alert('Erro: ' + error.detail);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm("Deseja realmente deletar esta edição?");
    if (!confirmed) return;

    const res = await fetch(`http://localhost:8000/edicoes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Edição deletada!');
      navigate('/editions');
    } else {
      const error = await res.json();
      alert('Erro: ' + error.detail);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">{id ? 'Editar Edição' : 'Nova Edição'}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <label>
          Ano:
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

        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
          {id ? 'Salvar Alterações' : 'Criar Edição'}
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
