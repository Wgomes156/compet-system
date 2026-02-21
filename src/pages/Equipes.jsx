import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle, Save, X } from 'lucide-react'
import { api } from '../utils/api'

const Equipes = () => {
    const [equipes, setEquipes] = useState([])
    const [atletas, setAtletas] = useState([])
    const [isByBackend, setIsByBackend] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEquipe, setEditingEquipe] = useState(null)
    const [formData, setFormData] = useState({ nome: '', tecnico: '', contato: '' })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const eqData = await api.getEquipes()
            const atlData = await api.getAtletas()
            setEquipes(eqData)
            setAtletas(atlData)
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        try {
            if (editingEquipe) {
                await api.updateEquipe(editingEquipe.id, formData)
            } else {
                await api.createEquipe(formData)
            }
            await loadData()
            closeModal()
        } catch (error) {
            alert("Erro ao salvar equipe")
        }
    }

    const handleDelete = async (equipe) => {
        const atletasDaEquipe = atletas.filter(a => a.equipeId === equipe.id)

        if (atletasDaEquipe.length > 0) {
            alert(`Não é possível excluir a equipe ${equipe.nome} pois ela possui ${atletasDaEquipe.length} atleta(s) inscrito(s). Remova os atletas antes de excluir a equipe.`)
            return
        }

        if (window.confirm(`Deseja realmente excluir a equipe ${equipe.nome}? Esta ação não pode ser desfeita.`)) {
            try {
                await api.deleteEquipe(equipe.id)
                await loadData()
            } catch (error) {
                alert("Erro ao excluir equipe")
            }
        }
    }

    const openModal = (equipe = null) => {
        if (equipe) {
            setEditingEquipe(equipe)
            setFormData({ nome: equipe.nome, tecnico: equipe.tecnico, contato: equipe.contato })
        } else {
            setEditingEquipe(null)
            setFormData({ nome: '', tecnico: '', contato: '' })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingEquipe(null)
        setFormData({ nome: '', tecnico: '', contato: '' })
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Gestão de Equipes</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Cadastre e gerencie as agremiações participantes.</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={20} /> Nova Equipe
                </button>
            </div>

            <div className="glass-card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome da Equipe</th>
                                <th>Responsável / Técnico</th>
                                <th>Contato</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                                        Nenhuma equipe cadastrada até o momento.
                                    </td>
                                </tr>
                            ) : (
                                equipes.map(equipe => (
                                    <tr key={equipe.id}>
                                        <td style={{ fontWeight: '700', color: 'var(--accent)' }}>#{String(equipe.id).padStart(3, '0')}</td>
                                        <td style={{ color: '#fff', fontWeight: '500' }}>{equipe.nome}</td>
                                        <td>{equipe.tecnico}</td>
                                        <td>{equipe.contato}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => openModal(equipe)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ff4d4d', borderColor: '#ff4d4d' }} onClick={() => handleDelete(equipe)}>
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
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingEquipe ? 'Editar Equipe' : 'Nova Equipe'}</h2>
                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome da Equipe</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Associação de Judô Bushido"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Responsável / Técnico</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.tecnico}
                                    onChange={e => setFormData({ ...formData, tecnico: e.target.value })}
                                    placeholder="Nome do sensei"
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contato (E-mail/Telefone)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.contato}
                                    onChange={e => setFormData({ ...formData, contato: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    <X size={20} /> Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={20} /> {editingEquipe ? 'Salvar Alterações' : 'Cadastrar Equipe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Equipes
