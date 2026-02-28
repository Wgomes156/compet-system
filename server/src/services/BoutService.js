import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const registrarVencedor = async (lutaId, vencedorId, resultadoTipo) => {
    const luta = await prisma.luta.findUnique({
        where: { id: lutaId },
        include: { categoria: true }
    });

    if (!luta) throw new Error("Luta não encontrada");
    if (luta.status === "ENCERRADA") throw new Error("Luta já encerrada");
    if (luta.status === "BLOQUEADA") throw new Error("Luta bloqueada");

    const derrotadoId = luta.atletaAId === vencedorId ? luta.atletaBId : luta.atletaAId;

    const lutaAtualizada = await prisma.luta.update({
        where: { id: lutaId },
        data: {
            vencedorId,
            derrotadoId,
            resultadoTipo,
            status: "ENCERRADA",
            timestampResultado: new Date(),
        }
    });

    // 1. Avançar vencedor
    if (luta.proximaLutaId) {
        await avancarVencedor(luta, vencedorId);
    }

    // 2. Processar derrotado para repescagem
    await processarDerrotado(luta, derrotadoId, vencedorId);

    // 3. Se for semifinal, criar disputa de bronze
    if (luta.nomeRodada === "Semifinal") {
        await criarDisputaDeBronze(luta.categoriaId);
    }

    // 4. Verificar se a Categoria foi concluída
    await verificarConclusaoCategoria(luta.categoriaId);

    return lutaAtualizada;
};

async function avancarVencedor(lutaAtual, vencedorId) {
    const proximaLuta = await prisma.luta.findUnique({
        where: { id: lutaAtual.proximaLutaId }
    });

    if (!proximaLuta) return;

    const data = {};
    if (lutaAtual.posicao % 2 === 1) {
        data.atletaAId = vencedorId;
    } else {
        data.atletaBId = vencedorId;
    }

    // Se agora ambos os atletas estão preenchidos, desbloqueia a luta
    if ((data.atletaAId && proximaLuta.atletaBId) || (data.atletaBId && proximaLuta.atletaAId)) {
        data.status = "AGUARDANDO";
    }

    await prisma.luta.update({
        where: { id: proximaLuta.id },
        data
    });
}

async function processarDerrotado(luta, derrotadoId, vencedorId) {
    // Registrar a derrota para rastreamento de repescagem
    // O lado do bracket (A ou B) é determinado pela posição inicial
    const lado = luta.posicao <= (Math.pow(2, luta.rodada) / 2) ? "A" : "B";

    await prisma.registroDerrota.create({
        data: {
            atletaId: derrotadoId,
            derrotadoPorId: vencedorId,
            rodada: luta.rodada,
            ladoBracket: lado,
            categoriaId: luta.categoriaId,
            elegivel: false // Será atualizado quando o vencedor chegar à final
        }
    });

    // Atualizar elegibilidade em cascata
    await atualizarElegibilidadeEmCascata(luta.categoriaId);
}

export const atualizarElegibilidadeEmCascata = async (categoriaId) => {
    // 1. Identificar quem está na final
    const final = await prisma.luta.findFirst({
        where: { categoriaId, nomeRodada: "Final" }
    });

    if (!final) return;

    // Atletas que chegaram à final (vencedores das semifinais)
    // Nota: A final pode ainda não ter acontecido, mas os atletas já são finalistas.
    const finalistas = [];
    if (final.atletaAId) finalistas.push(final.atletaAId);
    if (final.atletaBId) finalistas.push(final.atletaBId);

    // Para cada finalista, todos que ele derrotou e todos que os derrotados por ele derrotaram...
    // Na verdade, a regra do Bagnall-Wild é: todos que perderam para os finalistas.

    for (const finalistaId of finalistas) {
        await marcarComoElegivelRecursivo(finalistaId, categoriaId);
    }

    // Após marcar elegíveis, montar as lutas de repescagem
    await montarLutasRepescagem(categoriaId);
};

const marcarComoElegivelRecursivo = async (vencedorId, categoriaId) => {
    const registros = await prisma.registroDerrota.findMany({
        where: { derrotadoPorId: vencedorId, categoriaId }
    });

    for (const reg of registros) {
        if (!reg.elegivel) {
            await prisma.registroDerrota.update({
                where: { id: reg.id },
                data: { elegivel: true }
            });
            // No Bagnall-Wild, se A perde para B, e B chega na final, A é elegível. 
            // Se C perdeu para A, C NÃO é necessariamente elegível a menos que a regra inclua repescagem total.
            // A maioria das federações usa "perdedores para os finalistas".
        }
    }
};

const montarLutasRepescagem = async (categoriaId) => {
    // Buscar atletas elegíveis por lado
    const elegiveis = await prisma.registroDerrota.findMany({
        where: { categoriaId, elegivel: true },
        orderBy: { rodada: 'asc' }
    });

    const grupoA = elegiveis.filter(e => e.ladoBracket === "A");
    const grupoB = elegiveis.filter(e => e.ladoBracket === "B");

    // TODO: Implementar repescagem completa Bagnall-Wild
    // Para cada grupo, os atletas se enfrentam na sequência da eliminação
};

/**
 * Wrapper para ser chamado via controller para garantir que o bronze existe
 */
export const verificarECriarBronzeRetroativo = async (categoriaId) => {
    return await criarDisputaDeBronze(categoriaId);
};

/**
 * Cria a Disputa de Bronze quando ambas as semifinais estiverem encerradas.
 * Os perdedores das semifinais se enfrentam pelo 3º lugar.
 */
async function criarDisputaDeBronze(categoriaId) {
    // Verificar se já existe disputa de bronze
    const bronzeExistente = await prisma.luta.findFirst({
        where: { categoriaId, nomeRodada: "Disputa de Bronze" }
    });
    if (bronzeExistente) return; // Já foi criada

    // Buscar todas as semifinais (ajustado para ser mais flexível com o nome)
    const semifinais = await prisma.luta.findMany({
        where: {
            categoriaId,
            nomeRodada: { in: ["Semifinal", "Semi-final", "Semifinais"] }
        }
    });

    // Precisamos de exatamente 2 semifinais
    if (semifinais.length !== 2) return;

    // Devem estar encerradas ou ser BYE
    if (!semifinais.every(s => s.status === "ENCERRADA" || s.status === "BYE")) return;

    // Os derrotados das semifinais disputam o bronze
    const derrotado1 = semifinais[0].derrotadoId;
    const derrotado2 = semifinais[1].derrotadoId;

    // Se NÃO houver nenhum derrotado (caso raro de dois BYEs em lados diferentes que resultam em nada), aborta
    if (!derrotado1 && !derrotado2) return;

    // Buscar a rodada mais alta para posicionar corretamente
    const maxRodada = await prisma.luta.aggregate({
        where: { categoriaId, bracketTipo: "PRINCIPAL" },
        _max: { rodada: true }
    });
    const rodadaBronze = (maxRodada._max.rodada || 1) + 1;

    // Criar a luta de bronze
    const novaLuta = await prisma.luta.create({
        data: {
            categoriaId,
            bracketTipo: "BRONZE",
            rodada: rodadaBronze,
            nomeRodada: "Disputa de Bronze",
            posicao: 1,
            atletaAId: derrotado1,
            atletaBId: derrotado2,
            status: (!derrotado1 || !derrotado2) ? "BYE" : "AGUARDANDO",
        }
    });

    // Se for BYE (um dos atletas já passou), registrar o vencedor automaticamente
    if (!derrotado1 || !derrotado2) {
        const bronzeVencedorId = derrotado1 || derrotado2;
        if (bronzeVencedorId) {
            await prisma.luta.update({
                where: { id: novaLuta.id },
                data: {
                    vencedorId: bronzeVencedorId,
                    status: "BYE"
                }
            });
        }
    }

    // Atualizar categoria para EM_ANDAMENTO caso estivesse como AGUARDANDO
    await prisma.categoria.update({
        where: { id: categoriaId },
        data: { status: "EM_ANDAMENTO" }
    });
}

export const verificarConclusaoCategoria = async (categoriaId) => {
    // 1. Verificar se a FINAL foi concluída
    const final = await prisma.luta.findFirst({
        where: { categoriaId, nomeRodada: "Final", status: "ENCERRADA" },
        include: { vencedor: true, derrotado: true }
    });

    if (!final) return; // Categoria ainda em andamento

    // 2. Verificar se as disputas de Bronze foram concluídas (se existirem)
    const bronzes = await prisma.luta.findMany({
        where: { categoriaId, nomeRodada: "Disputa de Bronze" }
    });

    // Se existem bronzes pendentes, não conclui ainda
    if (bronzes.length > 0) {
        const bronzesConcluidos = bronzes.every(l => l.status === "ENCERRADA" || l.status === "BYE");
        if (!bronzesConcluidos) return;
    }

    // 3. Montar o pódio
    const podioData = {
        primeiroId: final.vencedorId,
        segundoId: final.derrotadoId,
    };

    if (bronzes.length > 0) {
        podioData.terceiro1Id = bronzes[0]?.vencedorId;
        if (bronzes.length > 1) {
            podioData.terceiro2Id = bronzes[1]?.vencedorId;
        }
    }

    await prisma.podio.upsert({
        where: { categoriaId },
        update: podioData,
        create: {
            categoriaId,
            ...podioData
        }
    });

    await prisma.categoria.update({
        where: { id: categoriaId },
        data: { status: "CONCLUIDA" }
    });
};
