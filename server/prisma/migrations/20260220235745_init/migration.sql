-- CreateTable
CREATE TABLE "Equipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "tecnico" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Atleta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "graduacao" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "equipeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Atleta_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "graduacao" TEXT NOT NULL,
    "peso" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Luta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoriaId" TEXT NOT NULL,
    "bracketTipo" TEXT NOT NULL,
    "rodada" INTEGER NOT NULL,
    "nomeRodada" TEXT NOT NULL,
    "posicao" INTEGER NOT NULL,
    "lado" TEXT,
    "atletaAId" INTEGER,
    "atletaBId" INTEGER,
    "vencedorId" INTEGER,
    "derrotadoId" INTEGER,
    "resultadoTipo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BLOQUEADA',
    "proximaLutaId" TEXT,
    "lutaOrigemAId" TEXT,
    "lutaOrigemBId" TEXT,
    "repescagemElegivel" BOOLEAN NOT NULL DEFAULT false,
    "repescagemGrupo" TEXT,
    "timestampResultado" DATETIME,
    "historicoEdicoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Luta_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Luta_atletaAId_fkey" FOREIGN KEY ("atletaAId") REFERENCES "Atleta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Luta_atletaBId_fkey" FOREIGN KEY ("atletaBId") REFERENCES "Atleta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Luta_vencedorId_fkey" FOREIGN KEY ("vencedorId") REFERENCES "Atleta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Luta_derrotadoId_fkey" FOREIGN KEY ("derrotadoId") REFERENCES "Atleta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroDerrota" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "atletaId" INTEGER NOT NULL,
    "derrotadoPorId" INTEGER NOT NULL,
    "rodada" INTEGER NOT NULL,
    "ladoBracket" TEXT NOT NULL,
    "elegivel" BOOLEAN NOT NULL DEFAULT false,
    "categoriaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroDerrota_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Podio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoriaId" TEXT NOT NULL,
    "primeiroId" INTEGER,
    "segundoId" INTEGER,
    "terceiro1Id" INTEGER,
    "terceiro2Id" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Podio_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Podio_categoriaId_key" ON "Podio"("categoriaId");
