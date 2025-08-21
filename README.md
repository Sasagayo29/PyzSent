# PyzSent - Dashboard de Monitoramento de Instrumentos Piezométricos

O **PyzSent** é um sistema web interativo para visualização, filtragem e exportação de dados provenientes de instrumentos piezométricos. A ferramenta foi projetada para engenheiros, técnicos e pesquisadores que necessitam monitorar variações de pressão, temperatura e níveis piezométricos em campo.

## 🖥️ Funcionalidades

- Visualização interativa dos instrumentos em formato de cards.
- Filtros por instrumento, data e tipo (seco ou não).
- Visualização de detalhes e gráficos por instrumento:
  - Resultado em metros
  - Pressão
  - Temperatura
  - Pressão Barométrica
- Exportação de dados individuais ou filtrados em formato Excel.
- Gráfico geral com médias de todos os instrumentos.

## 📁 Estrutura do Projeto
📁 css/
└── style.css
📁 js/
└── script.js
📁 css/img/logo/
└── Blue & Black Technology Logo.svg
index.html

## 🛠️ Tecnologias Utilizadas

- **HTML5** e **CSS3**: estrutura e estilo da interface.
- **JavaScript (vanilla)**: manipulação do DOM, filtros, carregamento e exportação de dados.
- **Chart.js**: geração de gráficos dinâmicos.
- **SheetJS (XLSX.js)**: exportação de dados em formato Excel.
- **Font Awesome**: ícones da interface.

## 📦 Requisitos

Para rodar o projeto localmente:

- Um navegador moderno (recomendado: Chrome, Firefox, Edge).
- Hospedar os arquivos em um servidor local (ex: VS Code com Live Server ou Python HTTP Server).

## ⚙️ Como Funciona

### Autenticação Simples
O sistema realiza uma verificação básica de autenticação utilizando o `sessionStorage`. Caso o usuário não esteja autenticado, ele é redirecionado para a página de login (`login.html`). O logout remove o status de autenticação e também redireciona para o login.

### Estrutura e Inicialização
- Os dados são carregados a partir de uma planilha Excel (`Leituras.xlsx`) utilizando a biblioteca [SheetJS (XLSX.js)](https://github.com/SheetJS/sheetjs).
- Após o carregamento, os dados são processados e agrupados por instrumento.
- Cada instrumento recebe uma cor única para facilitar a visualização.

### Filtros e Contadores
- O usuário pode filtrar os instrumentos por nome, período (data início e fim) e pelo estado "seco" ou "não seco".
- Contadores exibem a quantidade total e filtrada de instrumentos, além do número de instrumentos secos e não secos.
- A validação de datas garante que a data final não seja anterior à data inicial.

### Painel Interativo
- O painel principal exibe cartões para cada instrumento filtrado, mostrando um ícone, nome e quantidade de leituras.
- Cada cartão é acessível via teclado e clique, abrindo uma seção de detalhes com gráficos e informações específicas.

### Feedback Visual e UX
- Um loader é exibido durante o carregamento dos dados.
- Notificações aparecem para informar sucesso ou erros (ex: falha no carregamento da planilha).
- Os gráficos utilizam o Chart.js com um plugin customizado para garantir fundo branco.

---

## 📂 Estrutura de Scripts Principais

- **Autenticação:** `checkAuth()`, `logout()`
- **Manipulação de dados:** `carregarPlanilha()`, `prepararDados()`
- **Filtros:** `filtrarInstrumentos()`, `validarDatas()`
- **Interface:** `montarPainelInstrumentos()`, `mostrarDetalhes()`
- **UI/UX:** `toggleLoader()`, `mostrarNotificacao()`

## 🚀 Como Usar

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/pyzsent.git
2. Abra o arquivo index.html em seu navegador, preferencialmente com um servidor local para evitar restrições de CORS.
3. Utilize os filtros para ajustar a visualização dos instrumentos.
4. Clique nos cartões para visualizar os gráficos e exportar os dados.
   
## 📸 Preview
<img width="1887" height="948" alt="image" src="https://github.com/user-attachments/assets/816d4d8d-992e-4ee6-ad9c-ff8108379ddb" />
