import { registrarVencedor } from './src/services/BoutService.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    // Buscar uma semifinal qualquer
    const semi = await prisma.luta.findFirst({
        where: { nomeRodada: 'Semifinal' },
    });

    if (!semi) {
        console.log("Nenhuma semifinal encontrada");
        return;
    }

    console.log(`Resetando e testando com luta: ${semi.id}`);

    // Resetar status para testar
    await prisma.luta.update({
        where: { id: semi.id },
        data: { status: 'AGUARDANDO', vencedorId: null, derrotadoId: null }
    });

    try {
        const res = await registrarVencedor(semi.id, semi.atletaAId, 'NORMAL');
        console.log("Sucesso!", res);
    } catch (error) {
        console.error("ERRO CAPTURADO:", error);
        console.error("STACK:", error.stack);
    }
}

run().finally(() => prisma.$disconnect());
