# COMPET SYSTEM  - ANTIGRAVITY/VSCODE 🥋🥇

Sistema completo de gestão de competições de Judô, desenvolvido para facilitar a organização, inscrição de atletas, geração de chaves e controle de resultados.

## 🚀 Como Rodar o Projeto

Para configurar e rodar o sistema localmente, siga os passos abaixo:

### Pré-requisitos
- [Node.js](https://nodejs.org/) (recomendado versão 18 ou superior)
- NPM ou Yarn

### Instalação e Execução

O sistema é composto por **duas partes** que precisam rodar simultaneamente:
- **Frontend** (React/Vite) — interface do usuário na porta `5173`
- **Backend** (Express/Prisma) — API de dados na porta `3001`

#### 1. Instalar as dependências

```bash
# Na pasta raiz do projeto
npm install

# Na pasta do servidor
cd server
npm install
cd ..
```

#### 2. Iniciar rodar o sistema

```bash
npm run dev:all
```

Este comando inicia **frontend e backend simultaneamente** em um único terminal. Você verá os logs de ambos com prefixos coloridos:
- 🟦 `[FRONTEND]` — Servidor Vite (porta `5173`)
- 🟨 `[BACKEND]` — API Express (porta `3001`)

#### 3. Acessar o sistema

Abra no navegador: **http://localhost:5173**

> [!TIP]
> Se preferir rodar apenas o frontend, use `npm run dev`. Para rodar apenas o backend, entre na pasta `server` e execute `npm run dev`.
## ✨ Funcionalidades Principais

- **📊 Dashboard:** Visão geral rápida com estatísticas de atletas, equipes e medalhas.
- **👥 Gestão de Equipes:** Cadastro completo de agremiações, técnicos e informações de contato.
- **🥋 Gestão de Atletas:** Cadastro de competidores com validação automática de categoria por peso, sexo e idade.
- **🏆 Chaveamento Automático:** Sistema de chaves Bagnall-Wild (eliminatória simples com repescagem) que suporta qualquer número de atletas, gerando lutas dinamicamente.
- **📄 Relatórios PDF:** 
    - Listagem geral por equipe.
    - Listagem por categorias de peso e graduação.
    - Exportação de todas as chaves de lutas prontas para impressão.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React.js + Vite
- **Estilização:** Vanilla CSS (Design Premium com Glassmorphism)
- **Ícones:** Lucide React
- **Documentos:** jsPDF + jsPDF-AutoTable
- **Persistência:** SQLite com Prisma ORM (Backend robusto e escalável)

---

## 🗄️ Banco de Dados

O sistema utiliza **Prisma** com **SQLite**. Para visualizar ou editar os dados:

1. No terminal do VS Code, certifique-se de estar na pasta **`server`**:
   ```bash
   cd server
   ```
2. Execute o comando:
   1- ```bash
   2- npx prisma studio
   ```
3. O painel abrirá no seu navegador em `http://localhost:5555`.

> [!TIP]
> No VS Code, você pode clicar com o botão direito na pasta `server` e selecionar **"Abrir no Terminal Integrado"** para garantir que o comando rode no local correto.

---

## 📂 Estrutura do Projeto

```text
src/
├── components/   # Componentes reutilizáveis
├── pages/        # Páginas principais (Atletas, Equipes, Chaveamento, Relatórios)
├── hooks/        # Hooks customizados para lógica de estado
├── utils/        # Funções utilitárias e geradores
├── App.jsx       # Componente principal e rotas
└── index.css     # Estilização global e variáveis de design
```

---

## 📝 Licença
Desenvolvido como parte do sistema **Compet System**. Todos os direitos reservados a PSC SERVICE CNPJ:48.117.061/0001-60.
