import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    const equipes = await prisma.equipe.findMany();
    res.json(equipes);
});

router.post('/', async (req, res) => {
    const { nome, tecnico, contato } = req.body;
    try {
        const equipe = await prisma.equipe.create({
            data: { nome, tecnico, contato }
        });
        res.json(equipe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, tecnico, contato } = req.body;
    try {
        const equipe = await prisma.equipe.update({
            where: { id: parseInt(id) },
            data: { nome, tecnico, contato }
        });
        res.json(equipe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.equipe.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
