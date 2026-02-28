import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const cat = await prisma.categoria.findFirst({
        where: { nome: 'Masculino | Preta | Ligeiro' }
    });

    if (!cat) {
        console.log("Categoria não encontrada");
        return;
    }

    console.log(`Categoria ID: ${cat.id}`);

    const lutas = await prisma.luta.findMany({
        where: { categoriaId: cat.id },
        orderBy: [
            { rodada: 'asc' },
            { posicao: 'asc' }
        ]
    });

    lutas.forEach(l => {
        console.log(`${l.nomeRodada} | Status: ${l.status} | Id: ${l.id} | A:${l.atletaAId} B:${l.atletaBId} V:${l.vencedorId} D:${l.derrotadoId}`);
    });
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
