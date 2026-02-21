import express from 'express';
import cors from 'cors';
import chaveamentoRoutes from './routes/chaveamento.js';
import athleteRoutes from './routes/atletas.js';
import teamRoutes from './routes/equipes.js';
import categoryRoutes from './routes/categorias.js';
import migrationRoutes from './routes/migrar.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chaveamento', chaveamentoRoutes);
app.use('/api/atletas', athleteRoutes);
app.use('/api/equipes', teamRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/migrar', migrationRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
