import { calcularTamanhoChave, distribuirAtletas, criarEstruturaBracket } from './src/services/BracketService.js';

const mockAtletas = [
    { id: 1, nome: "Atleta 1", equipeId: 1 },
    { id: 2, nome: "Atleta 2", equipeId: 2 },
    { id: 3, nome: "Atleta 3", equipeId: 1 },
    { id: 4, nome: "Atleta 4", equipeId: 3 },
    { id: 5, nome: "Atleta 5", equipeId: 2 },
    { id: 6, nome: "Atleta 6", equipeId: 4 },
    { id: 7, nome: "Atleta 7", equipeId: 3 },
    { id: 8, nome: "Atleta 8", equipeId: 1 },
];

console.log("--- Testing calcularTamanhoChave ---");
console.log("8 athletes:", calcularTamanhoChave(8));
console.log("3 athletes:", calcularTamanhoChave(3));

console.log("\n--- Testing distribuirAtletas (Team Separation) ---");
const posicionados = distribuirAtletas(mockAtletas);
console.log("Positioned Athletes IDs:", posicionados.map(a => a.id));
console.log("Positioned Teams IDs:", posicionados.map(a => a.equipeId));

console.log("\n--- Testing criarEstruturaBracket ---");
const bracket = criarEstruturaBracket("cat-1", posicionados);
console.log("Total Matches:", bracket.length);
console.log("Round 1 Matches:", bracket.filter(l => l.rodada === 1).length);

const firstRound = bracket.filter(l => l.rodada === 1);
firstRound.forEach(l => {
    console.log(`Match ${l.posicao}: Atleta ${l.atletaAId} vs Atleta ${l.atletaBId} (Next: ${l.proximaLutaId})`);
});
