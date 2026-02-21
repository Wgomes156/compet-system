import { v4 as uuidv4 } from 'uuid';

export const calcularTamanhoChave = (totalAtletas) => {
    if (totalAtletas <= 2) return { size: 2, byes: 2 - totalAtletas };
    if (totalAtletas <= 4) return { size: 4, byes: 4 - totalAtletas };
    if (totalAtletas <= 8) return { size: 8, byes: 8 - totalAtletas };
    if (totalAtletas <= 16) return { size: 16, byes: 16 - totalAtletas };
    if (totalAtletas <= 32) return { size: 32, byes: 32 - totalAtletas };
    return { size: 64, byes: 64 - totalAtletas };
};

/**
 * Distributes athletes across positions using a serpentine/snake algorithm
 * to separate athletes from the same team.
 */
export const distribuirAtletas = (atletas) => {
    // Group by team
    const gruposEquipe = {};
    atletas.forEach(atleta => {
        if (!gruposEquipe[atleta.equipeId]) gruposEquipe[atleta.equipeId] = [];
        gruposEquipe[atleta.equipeId].push(atleta);
    });

    // Sort groups by size (descending)
    const sortedGrupos = Object.values(gruposEquipe).sort((a, b) => b.length - a.length);

    const flatList = [];
    const total = atletas.length;

    // Flatten using a specific logic to maximize separation
    // We take one from each group sequentially
    let hasItems = true;
    let index = 0;
    while (hasItems) {
        hasItems = false;
        for (const grupo of sortedGrupos) {
            if (grupo[index]) {
                flatList.push(grupo[index]);
                hasItems = true;
            }
        }
        index++;
    }

    // Now we apply a mapping to position them in the bracket
    // For a power of 2 bracket, we want to separate early encounters.
    // Standard tournament seeds usually follow a specific pattern: 1 vs 8, 4 vs 5, etc.
    return flatList;
};

export const definirNomeRodada = (r, totalRodadas) => {
    if (r === totalRodadas) return "Final";
    if (r === totalRodadas - 1) return "Semifinal";
    if (r === totalRodadas - 2) return "Quartas de Final";
    if (r === totalRodadas - 3) return "Oitavas de Final";
    return `Rodada ${r}`;
};

export const criarEstruturaBracket = (categoriaId, atletasPosicionados) => {
    const { size: bracketSize } = calcularTamanhoChave(atletasPosicionados.length);
    const totalRodadas = Math.log2(bracketSize);
    const lutas = [];

    // Rodada 1
    for (let i = 0; i < bracketSize / 2; i++) {
        const posA = i * 2;
        const posB = i * 2 + 1;

        // We alternate from ends of the list to keep teams separated as much as possible
        // in the first round if they are grouped at the start of the list.
        // In a list [Eq1, Eq2, Eq3, Eq1, Eq2, Eq3], 
        // we want Eq1 at Pos 1 and another Eq1 at Pos 8 etc.

        const atletaA = atletasPosicionados[i] || null;
        const atletaB = atletasPosicionados[bracketSize - 1 - i] || null;

        const lutaId = uuidv4();
        const isBye = !atletaA || !atletaB;

        lutas.push({
            id: lutaId,
            categoriaId,
            bracketTipo: "PRINCIPAL",
            rodada: 1,
            nomeRodada: definirNomeRodada(1, totalRodadas),
            posicao: i + 1,
            atletaAId: atletaA ? atletaA.id : null,
            atletaBId: atletaB ? atletaB.id : null,
            status: isBye ? "BYE" : "AGUARDANDO",
            resultadoTipo: isBye ? "BYE" : null,
            vencedorId: isBye ? (atletaA ? atletaA.id : atletaB?.id) : null,
            derrotadoId: null,
            proximaLutaId: null, // Will calculate after creating all rounds
        });
    }

    // Rodadas subsequentes
    for (let r = 2; r <= totalRodadas; r++) {
        const numLutas = bracketSize / Math.pow(2, r);
        for (let i = 0; i < numLutas; i++) {
            lutas.push({
                id: uuidv4(),
                categoriaId,
                bracketTipo: "PRINCIPAL",
                rodada: r,
                nomeRodada: definirNomeRodada(r, totalRodadas),
                posicao: i + 1,
                atletaAId: null,
                atletaBId: null,
                status: "BLOQUEADA",
                proximaLutaId: null,
            });
        }
    }

    // Link matches
    for (let r = 1; r < totalRodadas; r++) {
        const currentRoundLutas = lutas.filter(l => l.rodada === r);
        const nextRoundLutas = lutas.filter(l => l.rodada === r + 1);

        currentRoundLutas.forEach(luta => {
            const nextPos = Math.ceil(luta.posicao / 2);
            const nextLuta = nextRoundLutas.find(nl => nl.posicao === nextPos);
            if (nextLuta) {
                luta.proximaLutaId = nextLuta.id;
                // If it was a BYE, we can already fill the next round's slot
                if (luta.status === "BYE" && luta.vencedorId) {
                    if (luta.posicao % 2 === 1) {
                        nextLuta.atletaAId = luta.vencedorId;
                    } else {
                        nextLuta.atletaBId = luta.vencedorId;
                    }
                    // If both slots are filled (by BYEs or otherwise), unlock next luta
                    if (nextLuta.atletaAId && nextLuta.atletaBId) {
                        nextLuta.status = "AGUARDANDO";
                    }
                }
            }
        });
    }

    return lutas;
};
