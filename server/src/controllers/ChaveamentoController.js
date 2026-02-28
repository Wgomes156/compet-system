import { PrismaClient } from '@prisma/client';
import * as BracketService from '../services/BracketService.js';
import * as BoutService from '../services/BoutService.js';

const prisma = new PrismaClient();

export const gerar = async (req, res) => {
    const { categoriaId, atletasIds } = req.body;

    try {
        const atletas = await prisma.atleta.findMany({
            where: { id: { in: atletasIds } }
        });

        const atletasPosicionados = BracketService.distribuirAtletas(atletas);
        const estrutura = BracketService.criarEstruturaBracket(categoriaId, atletasPosicionados);

        // Salvar no banco
        await prisma.luta.deleteMany({ where: { categoriaId } });
        await prisma.luta.createMany({ data: estrutura });

        await prisma.categoria.update({
            where: { id: categoriaId },
            data: { status: "EM_ANDAMENTO" }
        });

        res.json({ success: true, message: "Chaveamento gerado com sucesso" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const registrarResultado = async (req, res) => {
    const { lutaId, vencedorId, resultadoTipo } = req.body;

    try {
        const luta = await BoutService.registrarVencedor(lutaId, vencedorId, resultadoTipo);
        res.json({ success: true, luta });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const editarResultado = async (req, res) => {
    // TODO: Implementar lógica de reversão conforme Módulo 5
    res.status(501).json({ message: "Não implementado" });
};

export const getCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        // Garantir que a disputa de bronze existe se as semis terminaram
        await BoutService.verificarECriarBronzeRetroativo(id);

        const categoria = await prisma.categoria.findUnique({
            where: { id },
            include: {
                lutas: {
                    include: {
                        atletaA: { include: { equipe: true } },
                        atletaB: { include: { equipe: true } },
                        vencedor: true,
                    },
                    orderBy: [
                        { rodada: 'asc' },
                        { posicao: 'asc' }
                    ]
                },
                podio: {
                    include: {
                        primeiro: true,
                        segundo: true,
                        terceiro1: true,
                        terceiro2: true
                    }
                }
            }
        });
        res.json(categoria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const listAll = async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({
            include: {
                lutas: {
                    include: {
                        atletaA: { include: { equipe: true } },
                        atletaB: { include: { equipe: true } },
                        vencedor: true,
                    },
                    orderBy: [
                        { rodada: 'asc' },
                        { posicao: 'asc' }
                    ]
                },
                podio: {
                    include: {
                        primeiro: true,
                        segundo: true,
                        terceiro1: true,
                        terceiro2: true
                    }
                }
            }
        });
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPodio = async (req, res) => {
    const { id } = req.params;
    try {
        const podio = await prisma.podio.findUnique({
            where: { categoriaId: id },
            include: {
                primeiro: true,
                segundo: true,
                terceiro1: true,
                terceiro2: true
            }
        });
        res.json(podio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
