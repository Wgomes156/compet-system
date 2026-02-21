import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
    const { equipes, atletas } = req.body;
    const results = { equipesMigradas: 0, atletasMigrados: 0 };

    try {
        // 1. Migrar Equipes e mapear IDs antigos para novos
        const idMap = {}; // oldId -> newId

        for (const eq of equipes) {
            const novaEquipe = await prisma.equipe.create({
                data: {
                    nome: eq.nome,
                    tecnico: eq.tecnico || '',
                    contato: eq.contato || ''
                }
            });
            idMap[eq.id] = novaEquipe.id;
            results.equipesMigradas++;
        }

        // 2. Migrar Atletas usando o mapa de IDs
        for (const atl of atletas) {
            const novoEquipeId = idMap[atl.equipeId];
            if (novoEquipeId) {
                await prisma.atleta.create({
                    data: {
                        nome: atl.nome,
                        graduacao: atl.graduacao,
                        sexo: atl.sexo,
                        categoria: atl.categoria,
                        equipeId: novoEquipeId
                    }
                });
                results.atletasMigrados++;
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
