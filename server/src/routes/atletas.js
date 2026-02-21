import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    const atletas = await prisma.atleta.findMany({ include: { equipe: true } });
    res.json(atletas);
});

router.post('/', async (req, res) => {
    const { nome, graduacao, sexo, categoria, equipeId } = req.body;
    try {
        const atleta = await prisma.atleta.create({
            data: { nome, graduacao, sexo, categoria, equipeId: parseInt(equipeId) }
        });
        res.json(atleta);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, graduacao, sexo, categoria, equipeId } = req.body;
    try {
        const atleta = await prisma.atleta.update({
            where: { id: parseInt(id) },
            data: { nome, graduacao, sexo, categoria, equipeId: parseInt(equipeId) }
        });
        res.json(atleta);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.atleta.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
