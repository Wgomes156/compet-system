import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * pdfGenerator.js
 * Centraliza a geração de documentos PDF oficiais com layout de árvore (bracket).
 */

const COLORS = {
    PRIMARY: [10, 25, 47],    // Navy
    ACCENT: [255, 215, 0],    // Gold
    TEXT: [0, 0, 0],
    LINE: [180, 180, 180],
    WINNER: [0, 150, 0],
    LOSER: [150, 0, 0]
};

/**
 * Desenha a estrutura de árvore do bracket no PDF.
 * @param {jsPDF} doc O documento jsPDF
 * @param {Object} bracket O objeto com lutas e metadados
 * @param {number} startY Posição inicial Y
 */
export const drawBracketTree = (doc, bracket, startY = 45) => {
    const lutas = bracket.lutas || [];
    const lutasPrincipal = lutas.filter(l => l.bracketTipo === 'PRINCIPAL');

    // Agrupar por rodada
    const rodadas = {};
    lutasPrincipal.forEach(l => {
        if (!rodadas[l.rodada]) rodadas[l.rodada] = [];
        rodadas[l.rodada].push(l);
    });

    const totalRodadas = Object.keys(rodadas).length;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const availableWidth = pageWidth - (margin * 2);
    const colWidth = availableWidth / totalRodadas;

    const rowHeight = 15; // Altura base da caixa de luta
    const boxWidth = colWidth - 10;

    // Map para armazenar coordenadas (X, Y) central de cada luta para desenhar conectores
    const coords = {};

    // 1. Desenhar as colunas e as lutas
    Object.keys(rodadas).sort((a, b) => a - b).forEach(rStr => {
        const r = parseInt(rStr);
        const rodadaLutas = rodadas[r].sort((a, b) => a.posicao - b.posicao);
        const x = margin + (r - 1) * colWidth;

        // Cabeçalho da rodada
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(150);
        doc.text(rodadaLutas[0]?.nomeRodada?.toUpperCase() || `RODADA ${r}`, x, startY - 5);

        // Espaçamento vertical cresce exponencialmente
        // Rodada 1: Lutas ocupam posições fixas
        // Rodada 2: Lutas ocupam o centro entre 2 lutas da rodada anterior
        const matchesInRound = rodadaLutas.length;
        const totalHeight = 140; // Espaço vertical total reservado para a árvore

        rodadaLutas.forEach((luta, idx) => {
            // Cálculo do Y: Centralizar proporcionalmente
            const segment = totalHeight / matchesInRound;
            const y = startY + (idx * segment) + (segment / 2) - (rowHeight / 2);

            coords[luta.id] = { x, y, midY: y + (rowHeight / 2), rightX: x + boxWidth };

            // Desenhar Caixa da Luta
            doc.setDrawColor(200);
            doc.setLineWidth(0.1);
            doc.rect(x, y, boxWidth, rowHeight);

            // Atleta A (Cima)
            doc.setFontSize(7);
            doc.setTextColor(0);
            const nomeA = luta.atletaA ? luta.atletaA.nome.substring(0, 25) : (luta.status === 'BYE' ? 'BYE' : '---');
            const equipeA = luta.atletaA?.equipe?.nome?.substring(0, 15) || "";

            if (luta.vencedorId && luta.atletaAId === luta.vencedorId) {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...COLORS.WINNER);
            } else {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
            }
            doc.text(nomeA, x + 2, y + 5);
            doc.setFontSize(5);
            doc.setTextColor(100);
            doc.text(equipeA, x + boxWidth - 2, y + 5, { align: "right" });

            // Linha divisória interna
            doc.setDrawColor(230);
            doc.line(x, y + 7.5, x + boxWidth, y + 7.5);

            // Atleta B (Baixo)
            doc.setFontSize(7);
            if (luta.vencedorId && luta.atletaBId === luta.vencedorId) {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...COLORS.WINNER);
            } else {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
            }
            const nomeB = luta.atletaB ? luta.atletaB.nome.substring(0, 25) : (luta.status === 'BYE' ? '---' : '---');
            const equipeB = luta.atletaB?.equipe?.nome?.substring(0, 15) || "";
            doc.text(nomeB, x + 2, y + 12);
            doc.setFontSize(5);
            doc.setTextColor(100);
            doc.text(equipeB, x + boxWidth - 2, y + 12, { align: "right" });

            // Número da luta
            doc.setFontSize(6);
            doc.setTextColor(150);
            doc.text(`#${idx + 1 + (r > 1 ? Object.values(rodadas).slice(0, r - 1).flat().length : 0)}`, x + boxWidth + 1, y + rowHeight / 2 + 1.5);
        });
    });

    // 2. Desenhar Conectores
    doc.setDrawColor(...COLORS.LINE);
    doc.setLineWidth(0.2);
    lutasPrincipal.forEach(luta => {
        if (luta.proximaLutaId && coords[luta.id] && coords[luta.proximaLutaId]) {
            const from = coords[luta.id];
            const to = coords[luta.proximaLutaId];

            // Linha horizontal saindo da luta
            const midX = from.rightX + (colWidth - boxWidth) / 2;
            doc.line(from.rightX, from.midY, midX, from.midY);

            // Linha vertical de conexão
            doc.line(midX, from.midY, midX, to.midY);

            // Linha horizontal entrando na próxima luta
            doc.line(midX, to.midY, to.x, to.midY);
        }
    });
};

/**
 * Gera um documento PDF completo para um bracket.
 */
export const gerarPDFChaveTree = (bracket, docInput = null, preview = false) => {
    const doc = docInput || new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const now = new Date().toLocaleString('pt-BR');
    const margin = 14;

    // Header Estilo SIGE
    doc.setFillColor(...COLORS.PRIMARY);
    doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text('SIGE - SISTEMA DE GERENCIAMENTO DE EVENTOS', margin, 10);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('COMPET - JUDÔ SYSTEM', doc.internal.pageSize.width - margin, 10, { align: "right" });

    // Título da Categoria
    doc.setTextColor(...COLORS.PRIMARY);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(bracket.nome.toUpperCase(), margin, 28);

    doc.setDrawColor(...COLORS.ACCENT);
    doc.setLineWidth(1);
    doc.line(margin, 30, 80, 30);

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text(`Relatório de Chaveamento Oficial - Gerado em ${now}`, margin, 36);

    // Identificação de Chave (Canto Superior Direito)
    const totalAtletas = new Set([
        ...bracket.lutas.map(l => l.atletaAId).filter(id => id),
        ...bracket.lutas.map(l => l.atletaBId).filter(id => id)
    ]).size;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`Chave de ${totalAtletas}`, doc.internal.pageSize.width - margin, 28, { align: "right" });

    // Desenhar Árvore
    drawBracketTree(doc, bracket, 55);

    // Pódio (Canto Inferior Direito)
    if ((bracket.status === 'CONCLUIDO' || bracket.status === 'CONCLUIDA') && bracket.podio) {
        const podioX = doc.internal.pageSize.width - 80;
        const podioY = doc.internal.pageSize.height - 50;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.PRIMARY);
        doc.text('RESULTADO FINAL', podioX, podioY);

        doc.autoTable({
            startY: podioY + 2,
            margin: { left: podioX },
            tableWidth: 66,
            body: [
                ['1º', bracket.podio.primeiro?.nome || '---'],
                ['2º', bracket.podio.segundo?.nome || '---'],
                ['3º', bracket.podio.terceiro1?.nome || '---'],
                ['3º', bracket.podio.terceiro2?.nome || '---']
            ],
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 1 },
            columnStyles: { 0: { cellWidth: 8, fontStyle: 'bold' } }
        });
    }

    // Rodapé de Súmula
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('__________________________________________', margin, doc.internal.pageSize.height - 15);
    doc.text('ASSINATURA DO COORDENADOR TÉCNICO', margin, doc.internal.pageSize.height - 11);

    if (!docInput) {
        if (preview) {
            window.open(doc.output('bloburl'));
        } else {
            doc.save(`chave_${bracket.nome?.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        }
    }

    return doc;
};
