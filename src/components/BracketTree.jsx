import { useMemo } from 'react'
import { Trophy, Lock, CheckCircle, Play } from 'lucide-react'
import './BracketTree.css'

/**
 * BracketTree — Visualização de chaveamento no formato de árvore
 * Segue o layout SIGE/InfoEsporte (colunas por rodada, linhas conectoras)
 */
const BracketTree = ({ lutas = [], podio, bracketNome, bracketStatus, onLutaClick }) => {

    // Organizar lutas por rodada
    const rounds = useMemo(() => {
        if (!lutas || lutas.length === 0) return []

        const lutasPrincipal = lutas.filter(l => l.bracketTipo === 'PRINCIPAL')

        // Agrupar por rodada
        const rodadaMap = {}
        lutasPrincipal.forEach(luta => {
            if (!rodadaMap[luta.rodada]) rodadaMap[luta.rodada] = []
            rodadaMap[luta.rodada].push(luta)
        })

        // Ordenar por rodada e dentro de cada rodada por posição
        const sortedRounds = Object.keys(rodadaMap)
            .map(Number)
            .sort((a, b) => a - b)
            .map(rodada => {
                const lutasRodada = rodadaMap[rodada].sort((a, b) => a.posicao - b.posicao)
                return {
                    rodada,
                    nomeRodada: lutasRodada[0]?.nomeRodada || `Rodada ${rodada}`,
                    lutas: lutasRodada
                }
            })

        return sortedRounds
    }, [lutas])

    // Lutas de bronze (Disputa de Terceiro Colocado)
    const bronzeMatches = useMemo(() => {
        if (!lutas || lutas.length === 0) return []
        return lutas.filter(l => l.bracketTipo === 'BRONZE' || l.nomeRodada === 'Disputa de Bronze')
    }, [lutas])

    // Calcular o número de lutas para gerar um ID de luta legível
    const fightCounter = useMemo(() => {
        let counter = 0
        const map = {}
        rounds.forEach(round => {
            round.lutas.forEach(luta => {
                counter++
                map[luta.id] = counter
            })
        })
        // Incluir bronze matches na contagem
        bronzeMatches.forEach(luta => {
            counter++
            map[luta.id] = counter
        })
        return map
    }, [rounds, bronzeMatches])

    if (!lutas || lutas.length === 0) {
        return (
            <div className="bracket-empty">
                <Trophy size={64} opacity={0.1} />
                <p>Selecione ou gere uma categoria para visualizar o bracket.</p>
            </div>
        )
    }

    const getStatusClass = (status) => {
        switch (status) {
            case 'ENCERRADA': return 'status-encerrada'
            case 'AGUARDANDO': return 'status-aguardando'
            case 'BLOQUEADA': return 'status-bloqueada'
            case 'BYE': return 'status-bye'
            default: return ''
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ENCERRADA': return 's-encerrada'
            case 'AGUARDANDO': return 's-aguardando'
            case 'BLOQUEADA': return 's-bloqueada'
            case 'BYE': return 's-bye'
            default: return ''
        }
    }

    const isClickable = (luta) => {
        return luta.status === 'AGUARDANDO' || luta.status === 'ENCERRADA'
    }

    const handleClick = (luta) => {
        if (isClickable(luta) && onLutaClick) {
            onLutaClick(luta)
        }
    }

    const getBadgeClass = () => {
        if (bracketStatus === 'CONCLUIDA' || bracketStatus === 'CONCLUIDO') return 'concluida'
        if (bracketStatus === 'EM_ANDAMENTO') return 'em-andamento'
        return 'aguardando'
    }

    // Renderizar um slot de atleta
    const renderSlot = (atleta, luta, slotLabel) => {
        const isWinner = atleta && luta.vencedorId === atleta.id
        const isLoser = atleta && luta.vencedorId && luta.vencedorId !== atleta.id

        return (
            <div className={`bracket-slot ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}`}>
                <span className={`bracket-slot-name ${!atleta ? 'empty' : ''}`}>
                    {atleta ? atleta.nome : (luta.status === 'BYE' ? 'BYE' : '---')}
                </span>
                <span className="bracket-slot-equipe">
                    {atleta?.equipe?.nome || ''}
                </span>
            </div>
        )
    }

    // Renderizar um match
    const renderMatch = (luta, showSeed = false, seedA = null, seedB = null) => {
        const fightNum = fightCounter[luta.id]

        return (
            <div
                className="bracket-match-wrapper"
                key={luta.id}
            >
                <div
                    className={`bracket-match ${getStatusClass(luta.status)} ${isClickable(luta) ? 'clickable' : ''}`}
                    onClick={() => handleClick(luta)}
                >
                    <div className="bracket-match-header">
                        <span className="bracket-match-number">
                            Luta {fightNum}
                        </span>
                        <span className={`bracket-match-status ${getStatusLabel(luta.status)}`}>
                            {luta.status === 'BYE' ? 'BYE' : luta.status === 'ENCERRADA' ? '✓' : luta.status === 'AGUARDANDO' ? '●' : ''}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {showSeed && <span className="bracket-seed">{seedA || ''}</span>}
                        <div style={{ flex: 1 }}>
                            {renderSlot(luta.atletaA, luta, 'A')}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {showSeed && <span className="bracket-seed">{seedB || ''}</span>}
                        <div style={{ flex: 1 }}>
                            {renderSlot(luta.atletaB, luta, 'B')}
                        </div>
                    </div>

                    {luta.status === 'AGUARDANDO' && (
                        <div style={{
                            padding: '3px 8px',
                            textAlign: 'center',
                            borderTop: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: '700' }}>
                                <Play size={9} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                                REGISTRAR
                            </span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Construir pares de matches para conectores
    const renderRound = (round, roundIndex, isFirstRound) => {
        const matchPairs = []
        const matches = round.lutas

        if (roundIndex < rounds.length - 1) {
            // Agrupar em pares para linhas de conexão
            for (let i = 0; i < matches.length; i += 2) {
                matchPairs.push({
                    top: matches[i],
                    bottom: matches[i + 1] || null,
                    seedA: isFirstRound ? (i * 2 + 1) : null,
                    seedB: isFirstRound ? (i * 2 + 2) : null,
                    seedC: isFirstRound && matches[i + 1] ? (i * 2 + 3) : null,
                    seedD: isFirstRound && matches[i + 1] ? (i * 2 + 4) : null,
                })
            }
        } else {
            // Última rodada (Final) — sem pares
            matches.forEach((m, i) => {
                matchPairs.push({ top: m, bottom: null, single: true })
            })
        }

        return (
            <div className="bracket-round" key={round.rodada}>
                <div className="bracket-round-header">
                    {round.nomeRodada}
                </div>
                <div className="bracket-round-matches">
                    {matchPairs.map((pair, pairIdx) => {
                        if (pair.single) {
                            return (
                                <div className="bracket-pair" key={`single-${pairIdx}`} style={{ flex: 1 }}>
                                    {renderMatch(pair.top, isFirstRound, pair.seedA, pair.seedB)}
                                </div>
                            )
                        }
                        return (
                            <div className="bracket-pair" key={`pair-${pairIdx}`} style={{ flex: 1 }}>
                                {renderMatch(
                                    pair.top,
                                    isFirstRound,
                                    isFirstRound ? pair.seedA : null,
                                    isFirstRound ? pair.seedB : null
                                )}
                                {pair.bottom && renderMatch(
                                    pair.bottom,
                                    isFirstRound,
                                    isFirstRound ? pair.seedC : null,
                                    isFirstRound ? pair.seedD : null
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Renderizar a Disputa de Bronze
    const renderBronze = () => {
        if (!bronzeMatches || bronzeMatches.length === 0) return null

        return (
            <div className="bracket-repescagem">
                <div className="bracket-repescagem-title">
                    <Trophy size={18} /> DISPUTA DE TERCEIRO COLOCADO (BRONZE)
                </div>
                <div className="bracket-tree" style={{ minHeight: 'auto' }}>
                    <div className="bracket-round">
                        <div className="bracket-round-header">
                            Bronze
                        </div>
                        <div className="bracket-round-matches">
                            {bronzeMatches.map(luta => (
                                <div className="bracket-pair" key={luta.id}>
                                    {renderMatch(luta)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Renderizar o Pódio
    const renderPodio = () => {
        if (!podio) return null

        const isConcluida = bracketStatus === 'CONCLUIDA' || bracketStatus === 'CONCLUIDO'
        if (!isConcluida) return null

        return (
            <div className="bracket-podio">
                <div className="bracket-podio-title">
                    <Trophy size={18} /> RESULTADO FINAL (PÓDIO)
                </div>
                <div className="bracket-podio-item">
                    <span className="bracket-podio-rank gold">🥇 1º LUGAR</span>
                    <span className="bracket-podio-name">{podio.primeiro?.nome || '---'}</span>
                </div>
                <div className="bracket-podio-item">
                    <span className="bracket-podio-rank silver">🥈 2º LUGAR</span>
                    <span className="bracket-podio-name">{podio.segundo?.nome || '---'}</span>
                </div>
                <div className="bracket-podio-item">
                    <span className="bracket-podio-rank bronze">🥉 3º LUGAR</span>
                    <span className="bracket-podio-name">{podio.terceiro1?.nome || '---'}</span>
                </div>
                {podio.terceiro2 && (
                    <div className="bracket-podio-item">
                        <span className="bracket-podio-rank bronze">🥉 3º LUGAR</span>
                        <span className="bracket-podio-name">{podio.terceiro2?.nome || '---'}</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div>
            <div className="bracket-container">
                <div className="bracket-tree">
                    {rounds.map((round, idx) => renderRound(round, idx, idx === 0))}
                </div>
            </div>
            {renderBronze()}
            {renderPodio()}
        </div>
    )
}

export default BracketTree
