// Verificação de autenticação
function checkAuth() {
    // Em uma aplicação real, você verificaria um token JWT ou sessão
    // Aqui é apenas uma simulação básica
    const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
    
    if (!isAuthenticated && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}
document.getElementById('logoutBtn').addEventListener('click', logout);

// No login.js, após autenticação bem-sucedida:
sessionStorage.setItem('isAuthenticated', 'true');

// No evento de logout (que você pode adicionar):
function logout() {
    sessionStorage.removeItem('isAuthenticated');
    window.location.href = 'login.html';
} 

// Configuração inicial
let dados = {};
let coresInstrumentos = {};
let graficoGeral = null;
let chartResultado = null,
    chartPressao = null,
    chartTemperatura = null,
    chartPressaoBarometrica = null;
let instrumentoSelecionado = null;

// Elementos do DOM
const filtroInstrumento = document.getElementById("filtroInstrumento");
const filtroDataInicio = document.getElementById("filtroDataInicio");
const filtroDataFim = document.getElementById("filtroDataFim");
const filtroSeco = document.getElementById("filtroSeco");
const btnFiltrar = document.getElementById("btnFiltrar");
const btnExportar = document.getElementById("btnExportar");
const btnReset = document.getElementById("btnReset");
const btnExportarDetalhes = document.getElementById("btnExportarDetalhes");
const contadorInstrumentos = document.querySelector(".contador-instrumentos");
const contadorSeco = document.querySelector(".contador-seco");
const dataError = document.getElementById("dataError");

const painelInstrumentos = document.getElementById("painelInstrumentos");
const detalhesSection = document.getElementById("detalhesInstrumento");
const tituloInstrumento = document.getElementById("tituloInstrumento");
const infoInstrumento = document.getElementById("infoInstrumento");
const fecharDetalhesBtn = document.getElementById("fecharDetalhes");
const loader = document.getElementById("loader");

// Contextos dos gráficos
const ctxResultado = document
    .getElementById("graficoResultado")
    .getContext("2d");
const ctxPressao = document.getElementById("graficoPressao").getContext("2d");
const ctxTemperatura = document
    .getElementById("graficoTemperatura")
    .getContext("2d");
const ctxPressaoBarometrica = document
    .getElementById("graficoPressaoBarometrica")
    .getContext("2d");
const ctxGeral = document.getElementById("graficoGeral").getContext("2d");

// Mapeamento de cores com transparência
const colorMap = {
    blue: "rgba(0, 0, 255, 0.2)",
    green: "rgba(0, 128, 0, 0.2)",
    orange: "rgba(255, 165, 0, 0.2)",
    purple: "rgba(128, 0, 128, 0.2)",
    red: "rgba(255, 0, 0, 0.2)",
    yellow: "rgba(255, 255, 0, 0.2)",
};

// Plugin para fundo branco nos gráficos Chart.js
const whiteBackgroundPlugin = {
    id: "whiteBackground",
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    },
};

// Função para mostrar/ocultar loader
function toggleLoader(show) {
    if (show) {
        loader.classList.add("active");
    } else {
        loader.classList.remove("active");
    }
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem, tipo = "sucesso") {
    const notification = document.createElement("div");
    notification.className = `notification ${tipo}`;
    notification.innerHTML = `
        <i class="fas ${
            tipo === "sucesso" ? "fa-check-circle" : "fa-exclamation-circle"
        }"></i>
        ${mensagem}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("show");
    }, 100);

    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Função para gerar cores únicas para cada instrumento
function gerarCoresInstrumentos(instrumentos) {
    const cores = {};
    const hueStep = 360 / instrumentos.length;

    instrumentos.forEach((instr, index) => {
        const hue = index * hueStep;
        cores[instr] = `hsl(${hue}, 70%, 60%)`;
    });

    return cores;
}

// Função para atualizar o contador de instrumentos
function atualizarContadorInstrumentos(total, filtrados = null) {
    if (filtrados !== null && filtrados !== total) {
        contadorInstrumentos.textContent = `${filtrados}/${total} instrumentos`;
    } else {
        contadorInstrumentos.textContent = `${total} instrumentos`;
    }
}

// Função para atualizar o contador de seco/não seco
function atualizarContadorSeco(totalSeco, totalNaoSeco) {
    contadorSeco.textContent = `${totalSeco} seco, ${totalNaoSeco} não seco`;
}

// Função para converter datas Excel ou strings para Date
function parseDateExcel(value) {
    if (!value) return null;

    if (typeof value === "number") {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(excelEpoch.getTime() + value * 86400000);
    }

    if (typeof value === "string") {
        const formats = [
            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
            /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
        ];

        for (const regex of formats) {
            const m = value.match(regex);
            if (m) {
                const day = parseInt(m[1]);
                const month = parseInt(m[2]) - 1;
                const year = parseInt(m[3]);
                const fullYear = year < 100 ? 2000 + year : year;
                const date = new Date(fullYear, month, day);
                if (!isNaN(date)) return date;
            }
        }

        const d = new Date(value);
        return isNaN(d) ? null : d;
    }

    if (value instanceof Date && !isNaN(value)) return value;
    return null;
}

// Função para validar datas
function validarDatas() {
    const dataInicio = new Date(filtroDataInicio.value);
    const dataFim = new Date(filtroDataFim.value);

    if (dataInicio && dataFim && dataInicio > dataFim) {
        dataError.style.display = "block";
        return false;
    } else {
        dataError.style.display = "none";
        return true;
    }
}

// Carrega planilha Excel
function carregarPlanilha() {
    toggleLoader(true);

    fetch("Leituras.xlsx")
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.arrayBuffer();
        })
        .then((data) => {
            const wb = XLSX.read(data, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(ws, { defval: null });
            prepararDados(json);
            preencherFiltroInstrumentos();
            montarPainelInstrumentos(Object.keys(dados));
            montarGraficoGeral();
            mostrarNotificacao("Dados carregados com sucesso!");
        })
        .catch((err) => {
            console.error("Falha ao carregar planilha:", err);
            mostrarNotificacao(
                'Erro ao carregar os dados. Verifique o arquivo "Leituras.xlsx"',
                "erro"
            );
        })
        .finally(() => {
            toggleLoader(false);
        });
}

// Agrupa os dados por instrumento e formata datas
function prepararDados(json) {
    dados = {};

    json.forEach((item) => {
        const instr =
            item["Instrumento"] || item["instrumento"] || item["Nome"] || null;
        if (!instr) return;

        const dv = parseDateExcel(
            item["Data da Leitura"] ||
                item["Data da leitura"] ||
                item["Data"] ||
                item["data"]
        );
        item["Data da Leitura"] = dv;

        if (typeof item["Seco"] === "string") {
            const val = item["Seco"].toLowerCase().trim();
            item["Seco"] =
                val === "sim" ||
                val === "verdadeiro" ||
                val === "true" ||
                val === "1";
        } else {
            item["Seco"] = !!item["Seco"];
        }

        if (!dados[instr]) dados[instr] = [];
        dados[instr].push(item);
    });

    // Gerar cores para cada instrumento
    coresInstrumentos = gerarCoresInstrumentos(Object.keys(dados));
}

// Popula o filtro de instrumentos
function preencherFiltroInstrumentos() {
    const select = document.getElementById("filtroInstrumento");
    select.innerHTML =
        '<option value="todos" selected>Todos os Instrumentos</option>';

    const instrumentos = Object.keys(dados).sort((a, b) => a.localeCompare(b));

    instrumentos.forEach((instr) => {
        const opt = document.createElement("option");
        opt.value = instr;
        opt.textContent = instr;
        select.appendChild(opt);
    });

    // Atualiza o contador com o total de instrumentos
    atualizarContadorInstrumentos(instrumentos.length);
    atualizarContadoresSeco();
}

// Atualiza contadores de instrumentos secos/não secos
function atualizarContadoresSeco() {
    let totalSeco = 0;
    let totalNaoSeco = 0;

    Object.values(dados).forEach((leituras) => {
        const temSeco = leituras.some((l) => l["Seco"]);
        const temNaoSeco = leituras.some((l) => !l["Seco"]);

        if (temSeco) totalSeco++;
        if (temNaoSeco) totalNaoSeco++;
    });

    atualizarContadorSeco(totalSeco, totalNaoSeco);
}

// Filtra os instrumentos com base nos critérios selecionados
function filtrarInstrumentos() {
    if (!validarDatas()) return;

    const instrumentoSelecionado = filtroInstrumento.value;
    const dataInicio = filtroDataInicio.value
        ? new Date(filtroDataInicio.value)
        : null;
    const dataFim = filtroDataFim.value ? new Date(filtroDataFim.value) : null;
    const filtroSecoVal = filtroSeco.value;

    const instrumentosParaFiltrar =
        instrumentoSelecionado === "todos"
            ? Object.keys(dados)
            : [instrumentoSelecionado];

    const instrumentosFiltrados = instrumentosParaFiltrar.filter((instr) => {
        const leituras = dados[instr];
        return leituras.some((l) => {
            const dataLeitura = l["Data da Leitura"];
            if (!dataLeitura) return false;
            if (dataInicio && dataLeitura < dataInicio) return false;
            if (dataFim && dataLeitura > dataFim) return false;

            if (filtroSecoVal !== "todos") {
                const deveSerSeco = filtroSecoVal === "Sim";
                if (deveSerSeco !== l["Seco"]) return false;
            }

            return true;
        });
    });

    // Atualiza o contador com a quantidade filtrada
    atualizarContadorInstrumentos(
        Object.keys(dados).length,
        instrumentosFiltrados.length
    );

    montarPainelInstrumentos(instrumentosFiltrados);
    fecharDetalhes();
    montarGraficoGeral();
}

// Monta os cards no painel de instrumentos
function montarPainelInstrumentos(lista) {
    painelInstrumentos.innerHTML = "";

    if (lista.length === 0) {
        painelInstrumentos.innerHTML =
            '<p class="sem-resultados">Nenhum instrumento encontrado com os filtros selecionados.</p>';
        return;
    }

    lista.forEach((instr) => {
        const card = document.createElement("div");
        card.className = "card-instrumento";
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Ver detalhes do instrumento ${instr}`);
        card.tabIndex = 0;

        const img = document.createElement("img");
        img.src = dados[instr].some((l) => l["Seco"])
            ? "css/img/default-seco.png"
            : "css/img/default.png";
        img.alt = `Ícone do instrumento ${instr}`;
        img.loading = "lazy";
        img.onerror = () => {
            img.src = "css/img/default.png";
        };
        card.appendChild(img);

        const div = document.createElement("div");
        div.textContent = instr;
        card.appendChild(div);

        // Contador de leituras
        const contadorLeituras = document.createElement("span");
        contadorLeituras.className = "badge-contador";
        contadorLeituras.textContent = dados[instr].length;
        card.appendChild(contadorLeituras);

        // Aplicar cor do instrumento como borda
        if (coresInstrumentos[instr]) {
            card.style.borderBottom = `3px solid ${coresInstrumentos[instr]}`;
        }

        card.addEventListener("click", () => mostrarDetalhes(instr));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                mostrarDetalhes(instr);
            }
        });

        painelInstrumentos.appendChild(card);
    });
}

// Mostra detalhes e gráficos do instrumento selecionado
function mostrarDetalhes(instr) {
    instrumentoSelecionado = instr;
    tituloInstrumento.textContent = instr;
    detalhesSection.setAttribute("data-visible", "true");
    detalhesSection.setAttribute("aria-hidden", "false");

    detalhesSection.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const leituras = dados[instr].filter((l) => l["Data da Leitura"]);
    leituras.sort((a, b) => a["Data da Leitura"] - b["Data da Leitura"]);

    if (leituras.length === 0) {
        infoInstrumento.innerHTML =
            "<p>Nenhuma leitura válida encontrada para este instrumento.</p>";
        limparGraficosDetalhes();
        return;
    }

    const ultima = leituras[leituras.length - 1];
    infoInstrumento.innerHTML = `
        <p><strong>Data Última Leitura:</strong> ${ultima[
            "Data da Leitura"
        ].toLocaleString("pt-BR")}</p>
        <p><strong>Tipo de Leitura:</strong> ${
            ultima["Tipo de Leitura"] || "Não informado"
        }</p>
        <p><strong>Comentários:</strong> ${
            ultima["Comentários"] || "Nenhum comentário"
        }</p>
        <p><strong>Registrado por:</strong> ${
            ultima["Registrado por"] || "Não informado"
        }</p>
        <p><strong>Origem do Registro:</strong> ${
            ultima["Origem do Registro"] || "Não informada"
        }</p>
        <p><strong>Estado:</strong> ${ultima["Seco"] ? "Seco" : "Úmido"}</p>
        <p><strong>Total de Leituras:</strong> ${leituras.length}</p>
    `;

    montarGraficosDetalhes(leituras);
}

// Fecha a seção de detalhes
function fecharDetalhes() {
    instrumentoSelecionado = null;
    detalhesSection.setAttribute("data-visible", "false");
    detalhesSection.setAttribute("aria-hidden", "true");
    limparGraficosDetalhes();
}

// Destrói os gráficos existentes para evitar duplicação
function limparGraficosDetalhes() {
    [
        chartResultado,
        chartPressao,
        chartTemperatura,
        chartPressaoBarometrica,
    ].forEach((chart) => {
        if (chart) {
            chart.destroy();
        }
    });
    chartResultado = null;
    chartPressao = null;
    chartTemperatura = null;
    chartPressaoBarometrica = null;
}

// Monta os gráficos das métricas detalhadas
function montarGraficosDetalhes(arr) {
    limparGraficosDetalhes();

    const labels = arr.map((l) =>
        l["Data da Leitura"].toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    );

    const datasets = [
        {
            dados: arr.map((l) => parseFloat(l["Resultado (m)"]) || 0),
            label: "Resultado",
            color: "blue",
            unidade: "m",
        },
        {
            dados: arr.map((l) => parseFloat(l["Pressão"]) || 0),
            label: "Pressão",
            color: "green",
            unidade: "kPa",
        },
        {
            dados: arr.map((l) => parseFloat(l["Temperatura (ºC)"]) || 0),
            label: "Temperatura",
            color: "orange",
            unidade: "ºC",
        },
        {
            dados: arr.map((l) => parseFloat(l["Pressão Barométrica"]) || 0),
            label: "Pressão Barométrica",
            color: "purple",
            unidade: "hPa",
        },
    ];

    const ctxs = [
        ctxResultado,
        ctxPressao,
        ctxTemperatura,
        ctxPressaoBarometrica,
    ];

    datasets.forEach((ds, i) => {
        const config = {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: `${ds.label} (${ds.unidade})`,
                        data: ds.dados,
                        borderColor: ds.color,
                        backgroundColor:
                            colorMap[ds.color] ||
                            `rgba(${hexToRgb(ds.color)}, 0.2)`,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "nearest",
                    intersect: false,
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${
                                    context.dataset.label
                                }: ${context.parsed.y.toFixed(2)}`;
                            },
                        },
                    },
                    legend: {
                        display: true,
                        position: "top",
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 10,
                        },
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        beginAtZero: false,
                        grace: "5%",
                        title: {
                            display: true,
                            text: ds.unidade,
                        },
                    },
                },
            },
            plugins: [whiteBackgroundPlugin],
        };

        const chart = new Chart(ctxs[i], config);

        switch (i) {
            case 0:
                chartResultado = chart;
                break;
            case 1:
                chartPressao = chart;
                break;
            case 2:
                chartTemperatura = chart;
                break;
            case 3:
                chartPressaoBarometrica = chart;
                break;
        }
    });
}

// Monta o gráfico geral de quantidade de leituras com cores por instrumento
function montarGraficoGeral() {
    if (graficoGeral) {
        graficoGeral.destroy();
    }

    const instrumentos = Object.keys(dados).sort();
    const counts = instrumentos.map(
        (instr) => dados[instr].filter((l) => l["Data da Leitura"]).length
    );

    // Preparar cores para cada instrumento
    const cores = instrumentos.map((instr) => coresInstrumentos[instr]);

    // Criar legenda
    criarLegendaInstrumentos(instrumentos);

    graficoGeral = new Chart(ctxGeral, {
        type: "bar",
        data: {
            labels: instrumentos,
            datasets: [
                {
                    label: "Quantidade de Leituras",
                    data: counts,
                    backgroundColor: cores,
                    borderColor: cores.map((cor) =>
                        cor.replace(")", ", 1)").replace("hsl", "hsla")
                    ),
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        stepSize: 1,
                        font: {
                            size: 12,
                        },
                    },
                    title: {
                        display: true,
                        text: "Número de Leituras",
                        font: {
                            size: 14,
                        },
                    },
                },
                x: {
                    display: false, // Escondemos os labels do eixo X
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 12,
                        },
                    },
                },
            },
            plugins: {
                legend: {
                    display: false, // Desativamos a legenda padrão
                },
                tooltip: {
                    bodyFont: {
                        size: 14,
                    },
                    callbacks: {
                        label: function (context) {
                            return `Leituras: ${context.parsed.y}`;
                        },
                    },
                },
            },
        },
        plugins: [whiteBackgroundPlugin],
    });
}

// Função para criar a legenda personalizada
function criarLegendaInstrumentos(instrumentos) {
    // Remove a legenda anterior se existir
    const legendaAnterior = document.getElementById("legenda-instrumentos");
    if (legendaAnterior) {
        legendaAnterior.remove();
    }

    const legendaContainer = document.createElement("div");
    legendaContainer.id = "legenda-instrumentos";
    legendaContainer.className = "legenda-instrumentos";

    instrumentos.forEach((instr) => {
        const itemLegenda = document.createElement("div");
        itemLegenda.className = "item-legenda";

        const corLegenda = document.createElement("span");
        corLegenda.className = "cor-legenda";
        corLegenda.style.backgroundColor = coresInstrumentos[instr];

        const nomeInstrumento = document.createElement("span");
        nomeInstrumento.textContent = instr;

        itemLegenda.appendChild(corLegenda);
        itemLegenda.appendChild(nomeInstrumento);
        legendaContainer.appendChild(itemLegenda);
    });

    // Insere a legenda após o gráfico
    const container = document.getElementById("graficoGeralContainer");
    container.parentNode.insertBefore(legendaContainer, container.nextSibling);
}

// Função para exportar dados
function exportarDados() {
    if (!Object.keys(dados).length) {
        mostrarNotificacao("Nenhum dado disponível para exportar", "erro");
        return;
    }

    toggleLoader(true);

    try {
        const instrumentoSelecionado = filtroInstrumento.value;
        const dataInicio = filtroDataInicio.value
            ? new Date(filtroDataInicio.value)
            : null;
        const dataFim = filtroDataFim.value
            ? new Date(filtroDataFim.value)
            : null;
        const filtroSecoVal = filtroSeco.value;

        let dadosParaExportar = [];

        const instrumentosParaExportar =
            instrumentoSelecionado === "todos"
                ? Object.keys(dados)
                : [instrumentoSelecionado];

        instrumentosParaExportar.forEach((instr) => {
            dados[instr].forEach((leitura) => {
                const dataLeitura = leitura["Data da Leitura"];
                if (!dataLeitura) return;

                if (dataInicio && dataLeitura < dataInicio) return;
                if (dataFim && dataLeitura > dataFim) return;

                if (filtroSecoVal !== "todos") {
                    const deveSerSeco = filtroSecoVal === "Sim";
                    if (deveSerSeco !== leitura["Seco"]) return;
                }

                dadosParaExportar.push({
                    Instrumento: instr,
                    "Data da Leitura": dataLeitura.toLocaleString("pt-BR"),
                    "Resultado (m)": leitura["Resultado (m)"] || "",
                    Pressão: leitura["Pressão"] || "",
                    "Temperatura (ºC)": leitura["Temperatura (ºC)"] || "",
                    "Pressão Barométrica": leitura["Pressão Barométrica"] || "",
                    Seco: leitura["Seco"] ? "Sim" : "Não",
                    "Tipo de Leitura": leitura["Tipo de Leitura"] || "",
                    Comentários: leitura["Comentários"] || "",
                    "Registrado por": leitura["Registrado por"] || "",
                    "Origem do Registro": leitura["Origem do Registro"] || "",
                });
            });
        });

        if (dadosParaExportar.length === 0) {
            mostrarNotificacao(
                "Nenhum dado encontrado com os filtros selecionados",
                "erro"
            );
            return;
        }

        const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leituras");

        const nomeArquivo = `leituras_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);

        mostrarNotificacao(
            `Dados exportados com sucesso! (${dadosParaExportar.length} registros)`
        );
    } catch (err) {
        console.error("Erro ao exportar dados:", err);
        mostrarNotificacao("Erro ao exportar dados", "erro");
    } finally {
        toggleLoader(false);
    }
}

// Função para exportar dados do instrumento selecionado
function exportarDadosInstrumento() {
    if (!instrumentoSelecionado) {
        mostrarNotificacao("Nenhum instrumento selecionado", "erro");
        return;
    }

    toggleLoader(true);

    try {
        const leituras = dados[instrumentoSelecionado];
        if (!leituras || leituras.length === 0) {
            mostrarNotificacao(
                "Nenhuma leitura disponível para este instrumento",
                "erro"
            );
            return;
        }

        const dadosParaExportar = leituras.map((leitura) => ({
            Instrumento: instrumentoSelecionado,
            "Data da Leitura": leitura["Data da Leitura"]
                ? leitura["Data da Leitura"].toLocaleString("pt-BR")
                : "",
            "Resultado (m)": leitura["Resultado (m)"] || "",
            Pressão: leitura["Pressão"] || "",
            "Temperatura (ºC)": leitura["Temperatura (ºC)"] || "",
            "Pressão Barométrica": leitura["Pressão Barométrica"] || "",
            Seco: leitura["Seco"] ? "Sim" : "Não",
            "Tipo de Leitura": leitura["Tipo de Leitura"] || "",
            Comentários: leitura["Comentários"] || "",
            "Registrado por": leitura["Registrado por"] || "",
            "Origem do Registro": leitura["Origem do Registro"] || "",
        }));

        const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, instrumentoSelecionado);

        const nomeArquivo = `leituras_${instrumentoSelecionado}_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);

        mostrarNotificacao(
            `Dados de ${instrumentoSelecionado} exportados com sucesso! (${dadosParaExportar.length} registros)`
        );
    } catch (err) {
        console.error("Erro ao exportar dados do instrumento:", err);
        mostrarNotificacao("Erro ao exportar dados do instrumento", "erro");
    } finally {
        toggleLoader(false);
    }
}

// Função para resetar filtros
function resetarFiltros() {
    filtroInstrumento.value = "todos";
    filtroSeco.value = "todos";

    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    filtroDataInicio.valueAsDate = trintaDiasAtras;
    filtroDataFim.valueAsDate = hoje;

    dataError.style.display = "none";

    // Atualiza contadores
    atualizarContadorInstrumentos(Object.keys(dados).length);
    atualizarContadoresSeco();

    // Recarrega os dados
    montarPainelInstrumentos(Object.keys(dados));
    montarGraficoGeral();
    fecharDetalhes();

    mostrarNotificacao("Filtros resetados com sucesso");
}

// Função para converter cor hexadecimal para RGB
function hexToRgb(hex) {
    hex = hex.replace("#", "");
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

// Event Listeners
btnFiltrar.addEventListener("click", filtrarInstrumentos);
fecharDetalhesBtn.addEventListener("click", fecharDetalhes);
btnExportar.addEventListener("click", exportarDados);
btnExportarDetalhes.addEventListener("click", exportarDadosInstrumento);
btnReset.addEventListener("click", resetarFiltros);

// Validação de datas em tempo real
filtroDataInicio.addEventListener("change", validarDatas);
filtroDataFim.addEventListener("change", validarDatas);

document.addEventListener("keydown", (e) => {
    if (
        e.key === "Escape" &&
        detalhesSection.getAttribute("data-visible") === "true"
    ) {
        fecharDetalhes();
    }
});

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    resetarFiltros(); // Isso define as datas padrão e reseta outros filtros
    carregarPlanilha();
});
