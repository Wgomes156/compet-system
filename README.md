# JUDÔ COMPET SYSTEM 🥋🥇

Sistema completo de gestão de competições de Judô, desenvolvido para facilitar a organização, inscrição de atletas, geração de chaves e controle de resultados.

## 🚀 Como Rodar o Projeto

Para configurar e rodar o sistema localmente, siga os passos abaixo:

### Pré-requisitos
- [Node.js](https://nodejs.org/) (recomendado versão 18 ou superior)
- NPM ou Yarn

### Instalação e Execução
Abra o seu terminal na pasta raiz do projeto e execute os seguintes comandos:

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

Após rodar o comando `npm run dev`, o terminal exibirá um link (geralmente `http://localhost:5173`). Abra este link no seu navegador para acessar o sistema.

---

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
- **Persistência:** LocalStorage (para funcionamento offline e rápido)

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
Desenvolvido como parte do sistema **Judô Compet**. Todos os direitos reservados.
