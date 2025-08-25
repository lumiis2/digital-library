import React, { useEffect, useState } from "react";

function App() {
  const [artigos, setArtigos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/artigos")
      .then((res) => res.json())
      .then((data) => {
        setArtigos(data);
        setLoading(false);
      }) 
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding: 20}}>Carregando artigos...</div>;

  return (
    <div style={{padding: 40, fontFamily: "sans-serif", background: "#f7f7f7", minHeight: "100vh"}}>
      <h1 style={{textAlign: "center"}}>Artigos</h1>
      <div style={{display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center"}}>
        {artigos.map((artigo) => (
          <div key={artigo.id} style={{
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px #0001",
            padding: 24,
            width: 350,
            marginBottom: 16
          }}>
            <h2 style={{margin: "0 0 8px 0"}}>{artigo.titulo}</h2>
            <div style={{marginBottom: 8, color: "#555"}}><b>Área:</b> {artigo.area}</div>
            <div style={{marginBottom: 8, color: "#555"}}><b>Palavras-chave:</b> {artigo.palavras_chave}</div>
            <div style={{marginBottom: 8, color: "#555"}}>
              <b>Autores:</b> {artigo.authors.map(a => `${a.nome} ${a.sobrenome}`.trim()).join(", ")}
            </div>
            <div>
              <a href={artigo.pdf_path} target="_blank" rel="noopener noreferrer">
                📄 Baixar PDF
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;