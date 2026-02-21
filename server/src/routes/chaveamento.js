import express from 'express';
import * as ChaveamentoController from '../controllers/ChaveamentoController.js';

const router = express.Router();

router.post('/gerar', ChaveamentoController.gerar);
router.post('/luta/resultado', ChaveamentoController.registrarResultado);
router.put('/luta/editar', ChaveamentoController.editarResultado);
router.get('/categoria/:id', ChaveamentoController.getCategoria);
router.get('/all', ChaveamentoController.listAll);
router.get('/podio/:id', ChaveamentoController.getPodio);

export default router;
