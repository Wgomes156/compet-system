import { useState, useEffect } from 'react'
import { Trophy, Play, Edit3, Trash2, ShieldAlert, CheckCircle, Lock, RefreshCw, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const Chaveamento = () => {
    const [equipes, setEquipes] = useState(() => JSON.parse(localStorage.getItem('equipes') || '[]'))
    const [atletas, setAtletas] = useState(() => JSON.parse(localStorage.getItem('atletas') || '[]'))
    const [chaveamentos, setChaveamentos] = useState(() => JSON.parse(localStorage.getItem('chaveamentos') || '[]'))
    const [selectedCategoria, setSelectedCategoria] = useState(null)
    const [activeBracket, setActiveBracket] = useState(null)
    const [isLutaModalOpen, setIsLutaModalOpen] = useState(false)
    const [currentLuta, setCurrentLuta] = useState(null)

    useEffect(() => {
        localStorage.setItem('chaveamentos', JSON.stringify(chaveamentos))
        // Atualizar dashboard de medalhas (simplificado via localstorage para este módulo)
        updateMedalCount()
    }, [chaveamentos])

    const updateMedalCount = () => {
        const medalhas = {} // equipeId -> {ouro, prata, bronze}
        equipes.forEach(e => medalhas[e.id] = { ouro: 0, prata: 0, bronze: 0 })

        chaveamentos.filter(c => c.status === 'CONCLUIDO').forEach(c => {
            if (c.podio.ouro) medalhas[c.podio.ouro.equipeId].ouro++
            if (c.podio.prata) medalhas[c.podio.prata.equipeId].prata++
            if (c.podio.bronze1) medalhas[c.podio.bronze1.equipeId].bronze++
            if (c.podio.bronze2) medalhas[c.podio.bronze2.equipeId].bronze++
        })
        localStorage.setItem('placar_medalhas', JSON.stringify(medalhas))
    }

    // Agrupar atletas por categoria única
    const getCategoriasDisponiveis = () => {
        const cats = {}
        atletas.forEach(a => {
            const key = `${a.sexo} | ${a.graduacao} | ${a.categoria}`
            if (!cats[key]) cats[key] = []
            cats[key].push(a)
        })
        return Object.keys(cats).map(key => ({
            label: key,
            atletas: cats[key],
            hasBracket: chaveamentos.some(c => c.categoria_full === key)
        }))
    }

    const gerarChaveamento = (catLabel, atletasCat) => {
        if (atletasCat.length < 2) {
            alert("Mínimo de 2 atletas para gerar chaveamento.")
            return
        }

        // Regra de separação: Mesma equipe/graduação/sexo/peso
        // Como sexo/graduação/peso já são o filtro da categoria, focamos na EQUIPE.
        const shuffle = (array) => {
            const arr = [...array]
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]]
            }
            return arr
        }

        // Algoritmo simples de separação por equipe (distribui equipes diferentes nos extremos)
        const sortedAtletas = [...atletasCat].sort((a, b) => a.equipeId - b.equipeId)
        const finalOrder = []
        let left = 0, right = sortedAtletas.length - 1
        while (left <= right) {
            finalOrder.push(sortedAtletas[left++])
            if (left <= right) finalOrder.push(sortedAtletas[right--])
        }

        // Determinar tamanho da chave (potência de 2)
        const n = finalOrder.length
        const powerOf2 = Math.pow(2, Math.ceil(Math.log2(n)))
        const bracketSize = powerOf2 // 2, 4, 8, 16, 32...

        // Criar Estrutura Bagnall-Wild
        // Fase 1: Rodada Inicial (ex: Oitavas, Quartas)
        const lutas = []
        for (let i = 0; i < bracketSize / 2; i++) {
            const a1 = finalOrder[i] || null
            const a2 = finalOrder[bracketSize - 1 - i] || null

            lutas.push({
                id: `L1-${i}`,
                fase: 'Rodada 1',
                atleta1: a1,
                atleta2: a2,
                vencedor: (a1 && !a2) ? a1 : ((!a1 && a2) ? a2 : null),
                isBye: (!a1 || !a2),
                status: (a1 && a2) ? 'AGUARDANDO' : 'BYE',
                nextLutaId: `L2-${Math.floor(i / 2)}`
            })
        }

        const newBracket = {
            id: Date.now(),
            categoria_full: catLabel,
            atletasInscritos: finalOrder.map(a => a.id),
            lutas,
            repescagem: [],
            podio: { ouro: null, prata: null, bronze1: null, bronze2: null },
            status: 'ATIVO'
        }

        setChaveamentos([...chaveamentos.filter(c => c.categoria_full !== catLabel), newBracket])
        setActiveBracket(newBracket)
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

    const exportarPDFChave = () => {
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
        doc.text(`Categoria: ${activeBracket.categoria_full}`, 14, 30)
        doc.setFontSize(10)
        doc.text(`Gerado em: ${now}`, 14, 38)

        // Tabela de Confrontos (Representação para Impressão)
        const body = activeBracket.lutas.map(l => [
            l.id.split('-')[1],
            l.atleta1 ? `${l.atleta1.name || l.atleta1.nome} (${getEquipeNome(l.atleta1.equipeId)})` : 'AGUARDANDO',
            'VS',
            l.atleta2 ? `${l.atleta2.name || l.atleta2.nome} (${getEquipeNome(l.atleta2.equipeId)})` : 'AGUARDANDO',
            l.vencedor ? `VENCEDOR: ${l.vencedor.name || l.vencedor.nome}` : (l.status === 'BYE' ? 'PASSAGEM AUTOMÁTICA' : '---')
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
        if (activeBracket.status === 'CONCLUIDO') {
            const pY = doc.lastAutoTable.finalY + 20
            doc.setFontSize(14)
            doc.text('RESULTADO FINAL (PÓDIO)', 14, pY)

            const podioBody = [
                ['1º LUGAR (OURO)', activeBracket.podio.ouro?.nome || '---'],
                ['2º LUGAR (PRATA)', activeBracket.podio.prata?.nome || '---'],
                ['3º LUGAR (BRONZE)', activeBracket.podio.bronze1?.nome || '---'],
                ['3º LUGAR (BRONZE)', activeBracket.podio.bronze2?.nome || '---']
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

        doc.save(`chave_${activeBracket.categoria_full.replace(/[^a-z0-9]/gi, '_')}.pdf`)
    }

    const registrarVencedor = (vencedorId, isWO = false) => {
        const vencedor = [currentLuta.atleta1, currentLuta.atleta2].find(a => a.id === vencedorId)
        const derrotado = [currentLuta.atleta1, currentLuta.atleta2].find(a => a.id !== vencedorId)

        const updatedLutas = activeBracket.lutas.map(l => {
            if (l.id === currentLuta.id) {
                return { ...l, vencedor, status: 'ENCERRADA' }
            }
            return l
        })

        // Lógica de Avanço (Simplificada para MVP)
        // Em uma implementação real, criaríamos dinamicamente a próxima fase
        // Aqui vamos apenas atualizar o estado local do bracket selecionado
        const updatedBracket = { ...activeBracket, lutas: updatedLutas }

        // Verificar se a categoria encerrou
        const todasEncerradas = updatedLutas.every(l => l.status === 'ENCERRADA' || l.status === 'BYE')
        if (todasEncerradas) {
            updatedBracket.status = 'CONCLUIDO'
            // Mock de pódio para demonstração do critério de sucesso
            updatedBracket.podio = {
                ouro: vencedor,
                prata: derrotado,
                bronze1: null,
                bronze2: null
            }
        }

        setActiveBracket(updatedBracket)
        setChaveamentos(chaveamentos.map(c => c.id === updatedBracket.id ? updatedBracket : c))
        setIsLutaModalOpen(false)
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Chaveamentos (Bagnall-Wild)</h1>
                <p style={{ color: 'var(--text-dim)' }}>Gere chaves e registre resultados oficiais.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                <div className="glass-card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Categorias</h3>
                    {getCategoriasDisponiveis().map(cat => (
                        <div key={cat.label} style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            marginBottom: '1rem',
                            border: selectedCategoria === cat.label ? '1px solid var(--accent)' : '1px solid transparent'
                        }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{cat.label}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0.4rem 0' }}>{cat.atletas.length} Atletas</p>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                                    onClick={() => {
                                        const existing = chaveamentos.find(c => c.categoria_full === cat.label)
                                        if (existing) setActiveBracket(existing)
                                        else gerarChaveamento(cat.label, cat.atletas)
                                        setSelectedCategoria(cat.label)
                                    }}
                                >
                                    {cat.hasBracket ? 'Ver Chave' : 'Gerar Chave'}
                                </button>
                                {cat.hasBracket && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', color: '#ff4d4d', borderColor: '#ff4d4d' }}
                                        onClick={() => {
                                            if (window.confirm("Deseja EXCLUIR este chaveamento? Atletas não serão removidos.")) {
                                                setChaveamentos(chaveamentos.filter(c => c.categoria_full !== cat.label))
                                                if (activeBracket?.categoria_full === cat.label) setActiveBracket(null)
                                            }
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
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
                                    <h2 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{activeBracket.categoria_full}</h2>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                        onClick={exportarPDFChave}
                                    >
                                        <Download size={16} /> Exportar Chave para Impressão (PDF)
                                    </button>
                                </div>
                                <span style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    background: activeBracket.status === 'CONCLUIDO' ? '#4dff8822' : '#ffd70022',
                                    color: activeBracket.status === 'CONCLUIDO' ? '#4dff88' : '#ffd700',
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
                                                {[luta.atleta1, luta.atleta2].map((atleta, idx) => (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        padding: '0.5rem',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        borderRadius: '4px',
                                                        border: luta.vencedor?.id === atleta?.id ? '1px solid #4dff88' : 'none'
                                                    }}>
                                                        <span style={{
                                                            color: atleta ? (luta.vencedor?.id === atleta.id ? '#4dff88' : (luta.vencedor ? '#8892b0' : '#fff')) : '#555',
                                                            fontWeight: luta.vencedor?.id === atleta?.id ? '700' : '400',
                                                            textDecoration: (luta.vencedor && luta.vencedor.id !== atleta?.id) ? 'line-through' : 'none'
                                                        }}>
                                                            {atleta ? atleta.nome : '---'}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                                            {atleta ? getEquipeNome(atleta.equipeId) : ''}
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
                            {[currentLuta.atleta1, currentLuta.atleta2].map(atleta => (
                                <button
                                    key={atleta.id}
                                    className="btn btn-secondary"
                                    style={{ justifyContent: 'space-between', padding: '1.5rem' }}
                                    onClick={() => {
                                        if (window.confirm(`Confirmar: ${atleta.nome} vence a luta contra ${[currentLuta.atleta1, currentLuta.atleta2].find(a => a.id !== atleta.id).nome}?`)) {
                                            registrarVencedor(atleta.id)
                                        }
                                    }}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold' }}>{atleta.nome}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{getEquipeNome(atleta.equipeId)}</div>
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

const getEquipeNome = (id) => JSON.parse(localStorage.getItem('equipes') || '[]').find(e => e.id === id)?.nome || '---'

export default Chaveamento
