import { useState, useEffect } from 'react'
import { FileText, Download, PieChart, Trophy as TrophyIcon, Eye, Users, Building, BarChart } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { api } from '../utils/api'
import { gerarPDFChaveTree } from '../utils/pdfGenerator'

const Relatorios = () => {
    // ... items above ...
    const [equipes, setEquipes] = useState([])
    const [atletas, setAtletas] = useState([])
    const [chaveamentos, setChaveamentos] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const eqData = await api.getEquipes()
            const atlData = await api.getAtletas()
            const chData = await api.getAllChaveamentos()
            setEquipes(Array.isArray(eqData) ? eqData : [])
            setAtletas(Array.isArray(atlData) ? atlData : [])
            setChaveamentos(Array.isArray(chData) ? chData : [])
        } catch (error) {
            console.error("Erro ao carregar relatórios:", error)
        } finally {
            setLoading(false)
        }
    }

    // Cálculo de estatísticas para o dashboard
    const stats = {
        totalAtletas: atletas.length,
        totalEquipes: equipes.length,
        homens: atletas.filter(a => a.sexo === 'Masculino').length,
        mulheres: atletas.filter(a => a.sexo === 'Feminino').length,
        porEquipe: equipes.map(e => ({
            nome: e.nome,
            total: atletas.filter(a => a.equipeId === e.id).length
        })).sort((a, b) => b.total - a.total)
    }

    const getEquipeNome = (id) => equipes.find(e => e.id === id)?.nome || '---'

    const exportPDFEquipes = (preview = false) => {
        const doc = new jsPDF()
        const now = new Date().toLocaleString('pt-BR')

        doc.setFontSize(20)
        doc.text('Relatório Geral por Equipe', 14, 22)
        doc.setFontSize(10)
        doc.text(`Gerado em: ${now} `, 14, 30)

        equipes.forEach((equipe, index) => {
            const atletasEquipe = atletas.filter(a => a.equipeId === equipe.id)

            doc.autoTable({
                startY: index === 0 ? 40 : doc.lastAutoTable.finalY + 15,
                head: [[`Equipe: ${equipe.nome} (#${equipe.id})`, '', '', '']],
                body: [
                    ['Responsável:', equipe.tecnico, 'Contato:', equipe.contato],
                    ['Atletas Inscritos:', atletasEquipe.length, '', '']
                ],
                theme: 'plain',
                headStyles: { fillColor: [10, 25, 47], textColor: [255, 215, 0], fontSize: 12 },
                styles: { fontSize: 10, cellPadding: 2 }
            })

            if (atletasEquipe.length > 0) {
                doc.autoTable({
                    startY: doc.lastAutoTable.finalY + 2,
                    head: [['ID', 'Nome do Atleta', 'Sexo', 'Graduação', 'Categoria']],
                    body: atletasEquipe.map(a => [a.id, a.nome, a.sexo, a.graduacao, a.categoria]),
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] }
                })
            }
        })

        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(10)
            doc.setTextColor(150)
            doc.text(`Página ${i} de ${pageCount} `, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
            doc.text('Gerado pelo Compet System', 14, doc.internal.pageSize.height - 10)
        }

        if (preview) {
            window.open(doc.output('bloburl'))
        } else {
            doc.save('relatorio_equipes.pdf')
        }
    }

    const exportPDFCategorias = (preview = false) => {
        const doc = new jsPDF()
        const now = new Date().toLocaleString('pt-BR')

        doc.setFontSize(20)
        doc.text('Relatório por Categoria', 14, 22)
        doc.setFontSize(10)
        doc.text(`Gerado em: ${now} `, 14, 30)

        // Agrupamento: Sexo > Graduação > Categoria
        const sexos = ['Masculino', 'Feminino']
        const graduacoes = [...new Set(atletas.map(a => a.graduacao))]
        const pesos = [...new Set(atletas.map(a => a.categoria))]

        let currentY = 40

        sexos.forEach(sexo => {
            const atletasSexo = atletas.filter(a => a.sexo === sexo)
            if (atletasSexo.length === 0) return

            doc.setFontSize(16)
            doc.setTextColor(10, 25, 47)
            doc.text(sexo, 14, currentY)
            currentY += 10

            graduacoes.forEach(grad => {
                const atletasGrad = atletasSexo.filter(a => a.graduacao === grad)
                if (atletasGrad.length === 0) return

                doc.setFontSize(12)
                doc.text(`Graduação: ${grad} `, 20, currentY)
                currentY += 5

                const body = pesos.map(peso => {
                    const count = atletasGrad.filter(a => a.categoria === peso).length
                    return count > 0 ? [peso, count] : null
                }).filter(item => item !== null)

                if (body.length > 0) {
                    doc.autoTable({
                        startY: currentY,
                        margin: { left: 25 },
                        head: [['Categoria de Peso', 'Total de Atletas']],
                        body: body,
                        styles: { fontSize: 9 }
                    })
                    currentY = doc.lastAutoTable.finalY + 10
                }

                if (currentY > 250) {
                    doc.addPage()
                    currentY = 20
                }
            })
        })

        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(10)
            doc.setTextColor(150)
            doc.text(`Página ${i} de ${pageCount} `, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
            doc.text('Gerado pelo Compet System', 14, doc.internal.pageSize.height - 10)
        }

        if (preview) {
            window.open(doc.output('bloburl'))
        } else {
            doc.save('relatorio_categorias.pdf')
        }
    }

    const exportPDFTodosChaveamentos = (preview = false) => {
        if (chaveamentos.length === 0) {
            alert("Nenhum chaveamento gerado para exportar.")
            return
        }

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        })

        chaveamentos.forEach((bracket, index) => {
            if (index > 0) doc.addPage()
            gerarPDFChaveTree(bracket, doc, false) // Note: docInput is provided, so it won't save internally
        })

        if (preview) {
            window.open(doc.output('bloburl'))
        } else {
            doc.save('todos_os_chaveamentos.pdf')
        }
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Relatórios & Dashboard</h1>
                <p style={{ color: 'var(--text-dim)' }}>Visão geral da competição e exportação de documentos oficiais.</p>
            </div>

            <div className="stat-grid">
                <div className="glass-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Total de Atletas</p>
                            <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{stats.totalAtletas}</h2>
                        </div>
                        <TrophyIcon color="var(--accent)" size={48} opacity={0.2} />
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {stats.homens} Homens | {stats.mulheres} Mulheres
                    </div>
                </div>

                <div className="glass-card" style={{ borderLeft: '4px solid #4d94ff' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Minhas Equipes</p>
                    <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{stats.totalEquipes}</h2>
                </div>

                <div className="glass-card" style={{ borderLeft: '4px solid #4dff88', gridColumn: 'span 1' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Atletas por Equipe</p>
                    <div style={{ marginTop: '1rem' }}>
                        {stats.porEquipe.slice(0, 3).map(e => (
                            <div key={e.nome} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nome}</span>
                                <span style={{ fontWeight: '700' }}>{e.total}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <FileText color="var(--accent)" /> Exportação de Relatórios
            </h2>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h3>Relatório de Equipes</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '1rem 0' }}>
                        Lista completa de equipes e seus respectivos atletas inscritos.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => exportPDFEquipes(true)}>
                            <Eye size={18} /> Visualizar
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => exportPDFEquipes(false)}>
                            <Download size={18} /> Baixar
                        </button>
                    </div>
                </div>

                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h3>Relatório de Categorias</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '1rem 0' }}>
                        Agrupamento por sexo, graduação e categoria de peso.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => exportPDFCategorias(true)}>
                            <Eye size={18} /> Visualizar
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => exportPDFCategorias(false)}>
                            <Download size={18} /> Baixar
                        </button>
                    </div>
                </div>

                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h3>Relatório de Chaves</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '1rem 0' }}>
                        Todos os brackets gerados (um por página) prontos para impressão.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            onClick={() => exportPDFTodosChaveamentos(true)}
                            disabled={chaveamentos.length === 0}
                        >
                            <Eye size={18} /> Visualizar
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            onClick={() => exportPDFTodosChaveamentos(false)}
                            disabled={chaveamentos.length === 0}
                        >
                            <Download size={18} /> Baixar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Relatorios
