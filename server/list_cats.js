import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const cats = await prisma.categoria.findMany({
        select: { id: true, nome: true }
    });
    console.log(JSON.stringify(cats, null, 2));
}

run().finally(() => prisma.$disconnect());
