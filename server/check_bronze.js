import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const bronzeMatches = await prisma.luta.findMany({
        where: { nomeRodada: 'Disputa de Bronze' },
        include: { categoria: true }
    });

    console.log(`Total de lutas de bronze encontradas: ${bronzeMatches.length}`);
    bronzeMatches.forEach(l => {
        console.log(`Luta ID: ${l.id} | Categoria: ${l.categoria.nome} | Status: ${l.status}`);
    });

    const anyBronze = await prisma.luta.findFirst({
        where: { bracketTipo: 'BRONZE' }
    });
    console.log(`Qualquer luta com bracketTipo BRONZE: ${anyBronze ? anyBronze.id : 'Nenhuma'}`);
}

run().finally(() => prisma.$disconnect());
