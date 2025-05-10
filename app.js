// app.js

let mapaIridaceae = null;
console.log("🔄 Iniciando carregamento do JSON de Iridaceae...");

fetch('iridaceae.json')
  .then(response => {
    if (!response.ok) throw new Error('JSON not found');
    return response.json();
  })
  .then(json => {
    mapaIridaceae = json;
    console.log("✅ JSON de Iridaceae carregado:", mapaIridaceae);

    // Após carregar o JSON, registremos os cliques nos estados
    document.querySelectorAll('svg path').forEach(path => {
      path.addEventListener('click', onEstadoClick);
    });
    console.log("🗺️ Listeners de clique registrados em todos os estados.");
  })
  .catch(error => {
    console.error("❌ Falha ao carregar o JSON de Iridaceae:", error);
  });

function onEstadoClick() {
  const estadoId = this.id;
  console.log("\n🖱️ Estado clicado:", estadoId);

  // Mapeamento das siglas para os nomes dos estados
  const estadosBrasileiros = {
    "BR-AC": "Acre",
    "BR-AL": "Alagoas",
    "BR-AP": "Amapá",
    "BR-AM": "Amazonas",
    "BR-BA": "Bahia",
    "BR-CE": "Ceará",
    "BR-DF": "Distrito Federal",
    "BR-ES": "Espírito Santo",
    "BR-GO": "Goiás",
    "BR-MA": "Maranhão",
    "BR-MT": "Mato Grosso",
    "BR-MS": "Mato Grosso do Sul",
    "BR-MG": "Minas Gerais",
    "BR-PA": "Pará",
    "BR-PB": "Paraíba",
    "BR-PR": "Paraná",
    "BR-PE": "Pernambuco",
    "BR-PI": "Piauí",
    "BR-RJ": "Rio de Janeiro",
    "BR-RN": "Rio Grande do Norte",
    "BR-RS": "Rio Grande do Sul",
    "BR-RO": "Rondônia",
    "BR-RR": "Roraima",
    "BR-SC": "Santa Catarina",
    "BR-SP": "São Paulo",
    "BR-SE": "Sergipe",
    "BR-TO": "Tocantins"
  };

  if (!(estadoId in estadosBrasileiros)) {
    console.warn("⚠️ Sigla de estado não reconhecida:", estadoId);
    alert("Estado não encontrado.");
    return;
  }

  const nomeEstado = estadosBrasileiros[estadoId];
  console.log("📍 Nome do estado:", nomeEstado);

  // Monta a URL da API do GBIF
  const GBIF_OCCURRENCE_API = "https://api.gbif.org/v1/occurrence/search";
  const params = {
    familyKey: 7698,
    stateProvince: nomeEstado,
    limit: 100,
    mediaType: "StillImage"
  };
  const apiUrl = `${GBIF_OCCURRENCE_API}?${new URLSearchParams(params).toString()}`;
  console.log("🌐 URL da requisição GBIF:", apiUrl);

  // Faz a requisição
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      console.log("📥 Dados recebidos do GBIF:", data);

      const resultadoDiv = document.getElementById("resultado");
      if (!data.results || data.results.length === 0) {
        console.info("ℹ️ Nenhuma ocorrência retornada pelo GBIF.");
        resultadoDiv.innerHTML = `<p>Não foram encontradas espécies para este estado.</p>`;
        return;
      }

      // 1) Processa resultados em um dicionário único
      const especiesDict = {};
      data.results.forEach((occ, idx) => {
        console.log(`🔍 Ocorrência ${idx + 1}:`, occ);
        const especie = occ.species;
        if (especie) {
          const chave = `${especie}`.trim();
          if (!especiesDict[chave]) {
            const foto = (occ.media && occ.media[0] && occ.media[0].identifier) || null;
            especiesDict[chave] = { especie, foto };
            console.log("➕ Adicionada espécie ao dicionário:", chave, foto);
          }
        }
      });

      // 2) Extrai a sigla do estado e busca lista oficial no JSON
      const sigla = estadoId.split('-')[1];
      const validas = (mapaIridaceae && mapaIridaceae[sigla]) || [];
      console.log("✅ Espécies válidas segundo JSON para", sigla + ":", validas);

      // 3) Normaliza e filtra
      const validasNorm = validas.map(s => s.trim().toLowerCase());
      const todasEsp = Object.values(especiesDict);
      const filtradas = todasEsp.filter(e => {
        const nomeFull = `${e.especie}`.toLowerCase();
        return validasNorm.includes(nomeFull);
      });
      console.log("🔖 Espécies filtradas (aprovadas):", filtradas);

      // 4) Renderiza os cards no HTML
      resultadoDiv.innerHTML = `
        <h3>Espécies de Iridaceae em ${nomeEstado}</h3>
        <div class="grid-container">
          ${filtradas.map(e => `
            <div class="card">
              <img src="${e.foto}" alt="${e.especie}">
              <p><strong>${e.especie}</strong></p>
            </div>
          `).join('')}
        </div>
      `;
      console.log("🎨 Renderização concluída: cards inseridos no DOM.");

    })
    .catch(err => {
      console.error("❌ Erro na requisição GBIF:", err);
      document.getElementById("resultado")
        .innerHTML = `<p style="color:red;">Erro ao consultar a API.</p>`;
    });
}
