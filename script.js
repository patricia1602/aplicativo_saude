const formCadastro = document.getElementById("formCadastro");
const formIMC = document.getElementById("formIMC");
const resultado = document.getElementById("resultado");
const historico = document.getElementById("historico");
const mensagemCadastro = document.getElementById("mensagemCadastro");
const mensagemGrafico = document.getElementById("mensagemGrafico");
const canvas = document.getElementById("graficoIMC");

const CHAVE_PERFIL = "saude_perfil_v1";
const CHAVE_HISTORICO = "saude_historico_v1";

let perfil = lerDados(CHAVE_PERFIL, null);
let registros = lerDados(CHAVE_HISTORICO, []);

function lerDados(chave, padrao) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : padrao;
  } catch (erro) {
    return padrao;
  }
}

function salvarDados(chave, dados) {
  try {
    localStorage.setItem(chave, JSON.stringify(dados));
    return true;
  } catch (erro) {
    alert(
      "Não foi possível salvar. Verifique o espaço disponível e as configurações do navegador.",
    );
    return false;
  }
}

function mostrarPerfil() {
  if (perfil) {
    document.getElementById("nome").value = perfil.nome;
    document.getElementById("idade").value = perfil.idade;
    mensagemCadastro.textContent = "Cadastro carregado: " + perfil.nome;
  }
}

formCadastro.addEventListener("submit", function (event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const idade = Number(document.getElementById("idade").value);

  if (!nome || !Number.isInteger(idade) || idade < 1 || idade > 120) {
    mensagemCadastro.textContent =
      "Informe um nome e uma idade válida entre 1 e 120 anos.";
    return;
  }

  const perfilAnterior = perfil;
  perfil = { nome, idade };

  if (!salvarDados(CHAVE_PERFIL, perfil)) {
    perfil = perfilAnterior;
    return;
  }

  mensagemCadastro.textContent = "Cadastro salvo com sucesso!";
  resultado.textContent =
    "Olá, " + perfil.nome + "! Agora você pode calcular seu IMC.";
});

function classificarIMC(imc) {
  if (imc < 18.5) return "Abaixo da faixa de referência";
  if (imc < 25) return "Faixa de referência";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

function criarTabelaIMC(imc) {
  const tabela = document.createElement("table");
  tabela.className = "tabela-imc";

  const cabecalho = document.createElement("thead");
  const linhaCabecalho = document.createElement("tr");

  ["IMC", "Classificação"].forEach(function (texto) {
    const th = document.createElement("th");
    th.textContent = texto;
    linhaCabecalho.appendChild(th);
  });

  cabecalho.appendChild(linhaCabecalho);
  tabela.appendChild(cabecalho);

  const corpo = document.createElement("tbody");

  const faixas = [
    { limite: 18.5, faixa: "Abaixo de 18,5", nome: "Abaixo do peso" },
    { limite: 25, faixa: "18,5 a 24,9", nome: "Peso adequado" },
    { limite: 30, faixa: "25 a 29,9", nome: "Sobrepeso" },
    { limite: 35, faixa: "30 a 34,9", nome: "Obesidade grau I" },
    { limite: 40, faixa: "35 a 39,9", nome: "Obesidade grau II" },
    { limite: Infinity, faixa: "40 ou mais", nome: "Obesidade grau III" },
  ];

  faixas.forEach(function (item, indice) {
    const linha = document.createElement("tr");

    if (
      (indice === 0 && imc < 18.5) ||
      (indice > 0 && imc >= faixas[indice - 1].limite && imc < item.limite)
    ) {
      linha.className = "faixa-atual";
    }

    [item.faixa, item.nome].forEach(function (texto) {
      const td = document.createElement("td");
      td.textContent = texto;
      linha.appendChild(td);
    });

    corpo.appendChild(linha);
  });

  tabela.appendChild(corpo);
  return tabela;
}
function formatarNumero(numero) {
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

formIMC.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!perfil) {
    resultado.textContent = "Primeiro, preencha e salve seu cadastro.";
    return;
  }

  const peso = Number(document.getElementById("peso").value);
  const alturaCm = Number(document.getElementById("altura").value);

  if (
    !Number.isFinite(peso) ||
    peso < 1 ||
    peso > 500 ||
    !Number.isFinite(alturaCm) ||
    alturaCm < 50 ||
    alturaCm > 250
  ) {
    resultado.textContent =
      "Informe peso entre 1 e 500 kg e altura entre 50 e 250 cm.";
    return;
  }

  const altura = alturaCm / 100;
  const imc = peso / (altura * altura);

  const registro = {
    data: new Date().toISOString(),
    peso: peso,
    altura: altura,
    imc: imc,
    idade: perfil.idade,
  };

  const novosRegistros = [...registros, registro];

  if (!salvarDados(CHAVE_HISTORICO, novosRegistros)) {
    return;
  }

  registros = novosRegistros;
  mostrarResultado(registro);
  mostrarHistorico();
  desenharGrafico();
});

function mostrarResultado(registro) {
  resultado.replaceChildren();

  const titulo = document.createElement("h3");
  titulo.textContent = "Resultado de " + perfil.nome;
  resultado.appendChild(titulo);

  adicionarLinha(resultado, "IMC", formatarNumero(registro.imc));

  if (registro.idade < 20) {
    adicionarLinha(
      resultado,
      "Interpretação",
      "É necessário usar referências de IMC por idade e sexo.",
    );
    adicionarLinha(
      resultado,
      "Peso de referência",
      "Não calculado: a faixa adulta não se aplica.",
    );
    return;
  }

  adicionarLinha(
    resultado,
    "Classificação de triagem",
    classificarIMC(registro.imc),
  );

  const tituloTabela = document.createElement("h3");
  tituloTabela.textContent = "Tabela de classificação do IMC";
  resultado.appendChild(tituloTabela);

  resultado.appendChild(criarTabelaIMC(registro.imc));

  const minimo = 18.5 * registro.altura * registro.altura;
  const maximo = 24.9 * registro.altura * registro.altura;

  adicionarLinha(
    resultado,
    "Faixa de peso de referência",
    formatarNumero(minimo) + " a " + formatarNumero(maximo) + " kg",
  );

  const nota = document.createElement("p");
  nota.textContent =
    "Essa faixa é uma referência populacional, não uma meta individual.";
  resultado.appendChild(nota);
}

function adicionarLinha(elemento, rotulo, valor) {
  const p = document.createElement("p");
  const forte = document.createElement("strong");

  forte.textContent = rotulo + ": ";
  p.appendChild(forte);
  p.appendChild(document.createTextNode(valor));
  elemento.appendChild(p);
}

function mostrarHistorico() {
  historico.replaceChildren();

  if (registros.length === 0) {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 3;
    celula.textContent = "Nenhum resultado salvo.";
    linha.appendChild(celula);
    historico.appendChild(linha);
    return;
  }

  registros.forEach(function (registro) {
    const linha = document.createElement("tr");
    const data = new Date(registro.data).toLocaleDateString("pt-BR");

    [
      data,
      formatarNumero(registro.peso) + " kg",
      formatarNumero(registro.imc),
    ].forEach(function (valor) {
      const celula = document.createElement("td");
      celula.textContent = valor;
      linha.appendChild(celula);
    });

    historico.appendChild(linha);
  });
}

function desenharGrafico() {
  const contexto = canvas.getContext("2d");
  const larguraCSS = canvas.clientWidth;
  const alturaCSS = canvas.clientHeight;

  if (!larguraCSS || !alturaCSS) return;

  const escala = window.devicePixelRatio || 1;
  canvas.width = Math.round(larguraCSS * escala);
  canvas.height = Math.round(alturaCSS * escala);
  contexto.setTransform(escala, 0, 0, escala, 0, 0);
  contexto.clearRect(0, 0, larguraCSS, alturaCSS);

  if (registros.length === 0) {
    mensagemGrafico.textContent =
      "Salve pelo menos um resultado para visualizar o gráfico.";
    return;
  }

  const pontos = registros.slice(-12);
  const margem = { esquerda: 42, direita: 15, topo: 20, baixo: 35 };
  const largura = larguraCSS - margem.esquerda - margem.direita;
  const altura = alturaCSS - margem.topo - margem.baixo;

  const valores = pontos.map((item) => item.imc);
  let minimo = Math.min(...valores);
  let maximo = Math.max(...valores);

  minimo = Math.max(0, Math.floor(minimo - 2));
  maximo = Math.ceil(maximo + 2);

  if (maximo <= minimo) maximo = minimo + 1;

  function x(i) {
    return (
      margem.esquerda +
      (pontos.length === 1 ? largura / 2 : (i * largura) / (pontos.length - 1))
    );
  }

  function y(valor) {
    return margem.topo + ((maximo - valor) / (maximo - minimo)) * altura;
  }

  contexto.font = "12px Arial";
  contexto.textAlign = "right";
  contexto.textBaseline = "middle";
  contexto.strokeStyle = "#e0e8e4";
  contexto.fillStyle = "#586762";
  contexto.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const valor = minimo + ((maximo - minimo) * i) / 4;
    const posY = y(valor);

    contexto.beginPath();
    contexto.moveTo(margem.esquerda, posY);
    contexto.lineTo(larguraCSS - margem.direita, posY);
    contexto.stroke();
    contexto.fillText(formatarNumero(valor), margem.esquerda - 7, posY);
  }

  contexto.strokeStyle = "#176b55";
  contexto.lineWidth = 2;
  contexto.beginPath();

  pontos.forEach(function (ponto, i) {
    if (i === 0) contexto.moveTo(x(i), y(ponto.imc));
    else contexto.lineTo(x(i), y(ponto.imc));
  });

  contexto.stroke();

  pontos.forEach(function (ponto, i) {
    contexto.beginPath();
    contexto.arc(x(i), y(ponto.imc), 4, 0, Math.PI * 2);
    contexto.fillStyle = "#176b55";
    contexto.fill();
  });

  contexto.textAlign = "center";
  contexto.textBaseline = "top";

  pontos.forEach(function (ponto, i) {
    const data = new Date(ponto.data).toLocaleDateString("pt-BR");
    contexto.fillStyle = "#586762";
    contexto.fillText(data, x(i), alturaCSS - margem.baixo + 8);
  });

  mensagemGrafico.textContent =
    "Mostrando os últimos " + pontos.length + " resultados.";
}

document
  .getElementById("limparHistorico")
  .addEventListener("click", function () {
    if (registros.length === 0) {
      alert("O histórico já está vazio.");
      return;
    }

    const confirmar = confirm(
      "Deseja apagar todos os resultados do histórico?",
    );

    if (!confirmar) return;

    if (salvarDados(CHAVE_HISTORICO, [])) {
      registros = [];
      resultado.textContent = "Histórico apagado.";
      mostrarHistorico();
      desenharGrafico();
    }
  });

mostrarPerfil();
mostrarHistorico();
desenharGrafico();

window.addEventListener("resize", desenharGrafico);
