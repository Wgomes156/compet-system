import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Search, ShieldAlert } from 'lucide-react'
import { api } from '../utils/api'

const GRADUACOES = ['Branca', 'Azul', 'Amarela', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta']
const CATEGORIAS = ['Ligeiro', 'Meio-Leve', 'Leve', 'Meio-Médio', 'Médio', 'Meio-Pesado', 'Pesado', 'Super-Pesado']

const Atletas = () => {
    const [atletas, setAtletas] = useState([])
    const [equipes, setEquipes] = useState([])
    const [chaveamentos, setChaveamentos] = useState([])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAtleta, setEditingAtleta] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        nome: '',
        graduacao: 'Branca',
        sexo: 'Masculino',
        categoria: 'Ligeiro',
        equipeId: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const atlData = await api.getAtletas()
            const eqData = await api.getEquipes()
            setAtletas(Array.isArray(atlData) ? atlData : [])
            setEquipes(Array.isArray(eqData) ? eqData : [])
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
            setAtletas([])
            setEquipes([])
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            if (editingAtleta) {
                await api.updateAtleta(editingAtleta.id, formData)
            } else {
                await api.createAtleta(formData)
            }
            await loadData()
            closeModal()
        } catch (error) {
            alert("Erro ao salvar atleta")
        }
    }

    const handleDelete = async (atleta) => {
        // TODO: Verificar se o atleta está em algum chaveamento ativo via API

        const equipeNome = equipes.find(e => e.id === atleta.equipeId)?.nome || 'Equipe'
        if (window.confirm(`Deseja realmente excluir o atleta ${atleta.nome} da equipe ${equipeNome}? Esta ação não pode ser desfeita.`)) {
            try {
                await api.deleteAtleta(atleta.id)
                await loadData()
            } catch (error) {
                alert("Erro ao excluir atleta")
            }
        }
    }

    const openModal = (atleta = null) => {
        if (atleta) {
            setEditingAtleta(atleta)
            setFormData({
                nome: atleta.nome,
                graduacao: atleta.graduacao,
                sexo: atleta.sexo,
                categoria: atleta.categoria,
                equipeId: String(atleta.equipeId)
            })
        } else {
            setEditingAtleta(null)
            setFormData({
                nome: '',
                graduacao: 'Branca',
                sexo: 'Masculino',
                categoria: 'Ligeiro',
                equipeId: equipes.length > 0 ? String(equipes[0].id) : ''
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingAtleta(null)
    }

    const filteredAtletas = atletas.filter(a =>
        a.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getEquipeNome = (id) => equipes.find(e => e.id === id)?.nome || '---'

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Gestão de Atletas</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Inscrição única por atleta vinculado a uma equipe.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar atleta..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '250px' }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()} disabled={equipes.length === 0}>
                        <Plus size={20} /> Novo Atleta
                    </button>
                </div>
            </div>

            {equipes.length === 0 && (
                <div className="glass-card" style={{ border: '1px solid #ffaa0033', background: '#ffaa000a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ShieldAlert color="#ffaa00" />
                    <p style={{ color: '#ffaa00' }}>Para cadastrar atletas, é necessário cadastrar ao menos uma <strong>Equipe</strong> primeiro.</p>
                </div>
            )}

            <div className="glass-card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Nome Completo</th>
                                <th>Equipe</th>
                                <th>Sexo</th>
                                <th>Graduação</th>
                                <th>Categoria</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAtletas.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                                        Nenhum atleta encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredAtletas.map(atleta => (
                                    <tr key={atleta.id}>
                                        <td style={{ fontWeight: '700', color: 'var(--accent)' }}>#{atleta.id}</td>
                                        <td style={{ color: '#fff', fontWeight: '500' }}>{atleta.nome}</td>
                                        <td>{getEquipeNome(atleta.equipeId)}</td>
                                        <td>{atleta.sexo}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.05)',
                                                fontSize: '0.8rem',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {atleta.graduacao}
                                            </span>
                                        </td>
                                        <td>{atleta.categoria}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => openModal(atleta)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ff4d4d', borderColor: '#ff4d4d' }} onClick={() => handleDelete(atleta)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingAtleta ? 'Editar Atleta' : 'Novo Atleta'}</h2>
                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Kano Jigoro"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Equipe</label>
                                    <select
                                        value={formData.equipeId}
                                        onChange={e => setFormData({ ...formData, equipeId: e.target.value })}
                                        required
                                    >
                                        {equipes.map(eq => (
                                            <option key={eq.id} value={eq.id} style={{ background: '#112240' }}>{eq.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Sexo</label>
                                    <select
                                        value={formData.sexo}
                                        onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                                    >
                                        <option value="Masculino" style={{ background: '#112240' }}>Masculino</option>
                                        <option value="Feminino" style={{ background: '#112240' }}>Feminino</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Graduação</label>
                                    <select
                                        value={formData.graduacao}
                                        onChange={e => setFormData({ ...formData, graduacao: e.target.value })}
                                    >
                                        {GRADUACOES.map(g => (
                                            <option key={g} value={g} style={{ background: '#112240' }}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Categoria de Peso</label>
                                    <select
                                        value={formData.categoria}
                                        onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                    >
                                        {CATEGORIAS.map(c => (
                                            <option key={c} value={c} style={{ background: '#112240' }}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    <X size={20} /> Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={20} /> {editingAtleta ? 'Salvar Alterações' : 'Inscrever Atleta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// Import temporário para ShieldAlert que esqueci de exportar no App.jsx ou no index
const ShieldAlertIcon = ({ color }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
)

export default Atletas
