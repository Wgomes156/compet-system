import { useState, useEffect } from 'react'
import { Trophy, Play, Edit3, Trash2, ShieldAlert, CheckCircle, Lock, RefreshCw, Download, FileText, Eye } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { api } from '../utils/api'
import BracketTree from '../components/BracketTree'
import { gerarPDFChaveTree } from '../utils/pdfGenerator'

const Chaveamento = () => {
    const [equipes, setEquipes] = useState([])
    const [atletas, setAtletas] = useState([])
    const [categorias, setCategorias] = useState([])
    const [selectedCategoria, setSelectedCategoria] = useState(null)
    const [activeBracket, setActiveBracket] = useState(null)
    const [isLutaModalOpen, setIsLutaModalOpen] = useState(false)
    const [currentLuta, setCurrentLuta] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        initData()
    }, [])

    const initData = async () => {
        setLoading(true)
        try {
            await api.syncCategorias()
            const cats = await api.getCategorias()
            const eqData = await api.getEquipes()
            const atlData = await api.getAtletas()
            setCategorias(cats)
            setEquipes(eqData)
            setAtletas(atlData)
        } catch (error) {
            console.error("Erro ao inicializar dados:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadBracket = async (categoriaId) => {
        try {
            const bracket = await api.getChaveamento(categoriaId)
            setActiveBracket(bracket)
        } catch (error) {
            console.error("Erro ao carregar bracket:", error)
        }
    }

    const gerarChaveamento = async (cat) => {
        // Filtrar atletas que pertencem a esta categoria específica
        const catAtletas = atletas.filter(a =>
            a.sexo === cat.sexo &&
            a.graduacao === cat.graduacao &&
            a.categoria === cat.peso
        )

        if (catAtletas.length < 2) {
            alert(`Mínimo de 2 atletas inscritos para gerar chaveamento. Encontrados: ${catAtletas.length}`)
            return
        }

        setLoading(true)
        try {
            const res = await api.gerarChaveamento({
                categoriaId: cat.id,
                atletasIds: catAtletas.map(a => a.id)
            })
            if (res.success) {
                await initData() // Atualizar contagem
                await loadBracket(cat.id)
            }
        } catch (error) {
            console.error("Erro ao gerar chaveamento:", error)
            alert("Erro ao gerar chaveamento")
        } finally {
            setLoading(false)
        }
    }


    const openLutaModal = (luta) => {
        if (luta.status === 'BLOQUEADA' || luta.status === 'BYE' || luta.status === 'ENCERRADA') {
            if (luta.status === 'ENCERRADA') {
                // Verificar se pode corrigir (Módulo 4A.4)
                const dependentes = activeBracket.lutas.filter(l => l.dependeDe === luta.id && l.status === 'ENCERRADA')
                if (dependentes.length > 0) {
                    alert("Não é possível corrigir este resultado pois lutas subsequentes já foram registradas.")
                    return
                }
            } else {
                return
            }
        }
        setCurrentLuta(luta)
        setIsLutaModalOpen(true)
    }

    const exportarPDFChave = (preview = false) => {
        if (!activeBracket) return
        gerarPDFChaveTree(activeBracket, null, preview)
    }

    const registrarVencedor = async (vencedorId, isWO = false) => {
        try {
            await api.registrarResultado({
                lutaId: currentLuta.id,
                vencedorId,
                resultadoTipo: isWO ? 'WO' : 'NORMAL'
            })
            await loadBracket(selectedCategoria)
            setIsLutaModalOpen(false)
        } catch (error) {
            alert("Erro ao registrar resultado")
        }
    }

    const getEquipeNome = (id) => equipes.find(e => e.id === id)?.nome || '---'

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Chaveamentos (Bagnall-Wild)</h1>
                <p style={{ color: 'var(--text-dim)' }}>Gere chaves e registre resultados oficiais.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                <div className="glass-card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Categorias</h3>
                    {categorias.map(cat => (
                        <div key={cat.id} style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            marginBottom: '1rem',
                            border: selectedCategoria === cat.id ? '1px solid var(--accent)' : '1px solid transparent'
                        }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{cat.nome}</p>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                                    onClick={() => {
                                        setSelectedCategoria(cat.id)
                                        if (cat._count.lutas > 0) {
                                            loadBracket(cat.id)
                                        } else {
                                            gerarChaveamento(cat)
                                        }
                                    }}
                                >
                                    {cat._count.lutas > 0 ? 'Ver Chave' : 'Gerar Chave'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-card" style={{ minHeight: '600px', position: 'relative' }}>
                    {!activeBracket ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                            <Trophy size={64} opacity={0.1} />
                            <p>Selecione ou gere uma categoria para visualizar o bracket.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="bracket-header">
                                <div className="bracket-header-info">
                                    <h2>{activeBracket.nome}</h2>
                                    <div className="bracket-header-actions">
                                        <button
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                            onClick={() => exportarPDFChave(true)}
                                        >
                                            <Eye size={16} /> Visualizar PDF
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                            onClick={() => exportarPDFChave(false)}
                                        >
                                            <Download size={16} /> Baixar PDF
                                        </button>
                                    </div>
                                </div>
                                <span className={`bracket-status-badge ${(activeBracket.status === 'CONCLUIDO' || activeBracket.status === 'CONCLUIDA') ? 'concluida' : activeBracket.status === 'EM_ANDAMENTO' ? 'em-andamento' : 'aguardando'}`}>
                                    {activeBracket.status}
                                </span>
                            </div>

                            <BracketTree
                                lutas={activeBracket.lutas}
                                podio={activeBracket.podio}
                                bracketNome={activeBracket.nome}
                                bracketStatus={activeBracket.status}
                                onLutaClick={openLutaModal}
                            />
                        </div>
                    )}
                </div>
            </div>

            {isLutaModalOpen && currentLuta && (
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
                        <h2 style={{ marginBottom: '0.5rem' }}>Registrar Vencedor</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '0.9rem' }}>Selecione o vencedor do confronto.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {[currentLuta.atletaA, currentLuta.atletaB].filter(a => a !== null).map(atleta => (
                                <button
                                    key={atleta.id}
                                    className="btn btn-secondary"
                                    style={{ justifyContent: 'space-between', padding: '1.5rem' }}
                                    onClick={() => {
                                        if (window.confirm(`Confirmar: ${atleta.nome} vence a luta?`)) {
                                            registrarVencedor(atleta.id)
                                        }
                                    }}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold' }}>{atleta.nome}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{atleta.equipe?.nome}</div>
                                    </div>
                                    <CheckCircle size={24} color="var(--accent)" />
                                </button>
                            ))}

                            <button
                                className="btn btn-secondary"
                                style={{ color: '#ff4d4d', borderColor: '#ff4d4d', marginTop: '1rem' }}
                                onClick={() => alert("Selecione o atleta que deu W.O. no registro de vencedor.")}
                            >
                                Registrar W.O.
                            </button>
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', background: '#333', color: '#fff' }} onClick={() => setIsLutaModalOpen(false)}>
                            Fechar sem salvar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Chaveamento
