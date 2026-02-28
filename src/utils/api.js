const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
    // Atletas
    getAtletas: () => fetch(`${API_BASE_URL}/atletas`).then(res => res.json()),
    createAtleta: (data) => fetch(`${API_BASE_URL}/atletas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updateAtleta: (id, data) => fetch(`${API_BASE_URL}/atletas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deleteAtleta: (id) => fetch(`${API_BASE_URL}/atletas/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(res => res.json()),

    // Equipes
    getEquipes: () => fetch(`${API_BASE_URL}/equipes`).then(res => res.json()),
    createEquipe: (data) => fetch(`${API_BASE_URL}/equipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updateEquipe: (id, data) => fetch(`${API_BASE_URL}/equipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deleteEquipe: (id) => fetch(`${API_BASE_URL}/equipes/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(res => res.json()),

    // Categorias
    getCategorias: () => fetch(`${API_BASE_URL}/categorias`).then(res => res.json()),
    syncCategorias: () => fetch(`${API_BASE_URL}/categorias/sync`, { method: 'POST' }).then(res => res.json()),

    // Chaveamento
    getChaveamento: (categoriaId) => fetch(`${API_BASE_URL}/chaveamento/categoria/${encodeURIComponent(categoriaId)}`).then(res => res.json()),
    getAllChaveamentos: () => fetch(`${API_BASE_URL}/chaveamento/all`).then(res => res.json()),
    getPodio: (categoriaId) => fetch(`${API_BASE_URL}/chaveamento/podio/${encodeURIComponent(categoriaId)}`).then(res => res.json()),
    gerarChaveamento: (data) => fetch(`${API_BASE_URL}/chaveamento/gerar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    registrarResultado: (data) => fetch(`${API_BASE_URL}/chaveamento/luta/resultado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),

    // Migração
    migrar: (data) => fetch(`${API_BASE_URL}/migrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
};
