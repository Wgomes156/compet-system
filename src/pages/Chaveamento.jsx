import { useState, useEffect } from 'react'
import { Trophy, Play, Edit3, Trash2, ShieldAlert, CheckCircle, Lock, RefreshCw, Download, FileText, Eye } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { api } from '../utils/api'

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

    const gerarChaveamento = async (categoriaId) => {
        const catAtletas = atletas.filter(a => `${a.sexo} | ${a.graduacao} | ${a.categoria}` === categoriaId)
        if (catAtletas.length < 2) {
            alert("Mínimo de 2 atletas para gerar chaveamento.")
            return
        }

        try {
            await api.gerarChaveamento({
                categoriaId,
                atletasIds: catAtletas.map(a => a.id)
            })
            await loadBracket(categoriaId)
            const updatedCats = await api.getCategorias()
            setCategorias(updatedCats)
        } catch (error) {
            alert("Erro ao gerar chaveamento")
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

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        })
        const now = new Date().toLocaleString('pt-BR')

        doc.setFontSize(18)
        doc.setTextColor(10, 25, 47)
        doc.text('CHAVEAMENTO OFICIAL - JUDÔ', 14, 20)

        doc.setFontSize(12)
        doc.text(`Categoria: ${activeBracket.nome}`, 14, 30)
        doc.setFontSize(10)
        doc.text(`Gerado em: ${now}`, 14, 38)

        // Tabela de Confrontos (Representação para Impressão)
        const body = (activeBracket.lutas || []).map(l => [
            `${l.nomeRodada} - ${l.posicao}`,
            l.atletaA ? `${l.atletaA.nome} (${l.atletaA.equipe?.nome || '---'})` : 'AGUARDANDO',
            'VS',
            l.atletaB ? `${l.atletaB.nome} (${l.atletaB.equipe?.nome || '---'})` : 'AGUARDANDO',
            l.vencedor ? `VENCEDOR: ${l.vencedor.nome}` : (l.status === 'BYE' ? 'PASSAGEM AUTOMÁTICA' : '---')
        ])

        doc.autoTable({
            startY: 45,
            head: [['LUTA', 'ATLETA A', '', 'ATLETA B', 'RESULTADO']],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [10, 25, 47], textColor: [255, 215, 0] },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 15 },
                2: { cellWidth: 10, halign: 'center' }
            }
        })

        // Espaço para Pódio se concluído
        if ((activeBracket.status === 'CONCLUIDO' || activeBracket.status === 'CONCLUIDA') && activeBracket.podio) {
            const pY = doc.lastAutoTable.finalY + 20
            doc.setFontSize(14)
            doc.text('RESULTADO FINAL (PÓDIO)', 14, pY)

            const podioBody = [
                ['1º LUGAR (OURO)', activeBracket.podio.primeiro?.nome || '---'],
                ['2º LUGAR (PRATA)', activeBracket.podio.segundo?.nome || '---'],
                ['3º LUGAR (BRONZE)', activeBracket.podio.terceiro1?.nome || '---'],
                ['3º LUGAR (BRONZE)', activeBracket.podio.terceiro2?.nome || '---']
            ]

            doc.autoTable({
                startY: pY + 5,
                body: podioBody,
                theme: 'plain',
                styles: { fontSize: 11, fontStyle: 'bold' },
                columnStyles: { 0: { cellWidth: 50, textColor: [255, 100, 0] } }
            })
        }

        // Rodapé
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(9)
            doc.setTextColor(150)
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
            doc.text('Gerado pelo Sistema de Competição de Judô - Impressão Oficial de Súmula', 14, doc.internal.pageSize.height - 10)
        }

        if (preview) {
            window.open(doc.output('bloburl'))
        } else {
            doc.save(`chave_${activeBracket.nome?.replace(/[^a-z0-9]/gi, '_')}.pdf`)
        }
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
                                        if (cat._count.lutas > 0) loadBracket(cat.id)
                                        else gerarChaveamento(cat.id)
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                                <div>
                                    <h2 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{activeBracket.nome}</h2>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                                <span style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    background: (activeBracket.status === 'CONCLUIDO' || activeBracket.status === 'CONCLUIDA') ? '#4dff8822' : '#ffd70022',
                                    color: (activeBracket.status === 'CONCLUIDO' || activeBracket.status === 'CONCLUIDA') ? '#4dff88' : '#ffd700',
                                    border: '1px solid'
                                }}>
                                    {activeBracket.status}
                                </span>
                            </div>

                            {/* Bracket Visual (Simplificado em Lista para MVP) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Quadro Principal</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                    {activeBracket.lutas.map(luta => (
                                        <div
                                            key={luta.id}
                                            className={`glass-card ${luta.status === 'AGUARDANDO' ? 'animate-pulse' : ''}`}
                                            style={{
                                                padding: '1rem',
                                                cursor: (luta.status === 'AGUARDANDO' || luta.status === 'ENCERRADA') ? 'pointer' : 'default',
                                                opacity: luta.status === 'BLOQUEADA' ? 0.4 : 1,
                                                border: luta.status === 'ENCERRADA' ? '1px solid rgba(77, 255, 136, 0.3)' : ''
                                            }}
                                            onClick={() => openLutaModal(luta)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '1rem', color: 'var(--text-dim)' }}>
                                                <span>LUTA #{luta.id.split('-')[1]}</span>
                                                <span style={{
                                                    color: luta.status === 'ENCERRADA' ? '#4dff88' : (luta.status === 'BYE' ? '#8892b0' : 'var(--accent)')
                                                }}>
                                                    {luta.status}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {[luta.atletaA, luta.atletaB].map((atleta, idx) => (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        padding: '0.5rem',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        borderRadius: '4px',
                                                        border: luta.vencedorId === atleta?.id ? '1px solid #4dff88' : 'none'
                                                    }}>
                                                        <span style={{
                                                            color: atleta ? (luta.vencedorId === atleta.id ? '#4dff88' : (luta.vencedorId ? '#8892b0' : '#fff')) : '#555',
                                                            fontWeight: luta.vencedorId === atleta?.id ? '700' : '400',
                                                            textDecoration: (luta.vencedorId && luta.vencedorId !== atleta?.id) ? 'line-through' : 'none'
                                                        }}>
                                                            {atleta ? atleta.nome : '---'}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                                            {atleta ? atleta.equipe?.nome : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {luta.status === 'AGUARDANDO' && (
                                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.4rem', fontSize: '0.8rem' }}>
                                                    <Play size={14} /> Registrar Campeão
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
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
