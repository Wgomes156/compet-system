import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    const categorias = await prisma.categoria.findMany({
        include: {
            _count: {
                select: { lutas: true }
            }
        }
    });
    res.json(categorias);
});

router.post('/sync', async (req, res) => {
    // Logic to create categories based on existing athletes
    try {
        const athletes = await prisma.atleta.findMany();
        const categoriesFound = new Set();

        athletes.forEach(a => {
            const key = `${a.sexo} | ${a.graduacao} | ${a.categoria}`;
            categoriesFound.add(key);
        });

        for (const catKey of categoriesFound) {
            const [sexo, graduacao, peso] = catKey.split(' | ');
            await prisma.categoria.upsert({
                where: { id: catKey }, // Using catKey as ID for simplicity or just searching by name
                update: {},
                create: {
                    id: catKey,
                    nome: catKey,
                    sexo,
                    graduacao,
                    peso,
                    status: "AGUARDANDO"
                }
            });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
