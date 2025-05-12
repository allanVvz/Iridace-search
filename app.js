// app.js

// 1) Mapeamento das siglas para os nomes dos estados
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

let mapaIridaceae = null;
console.log("🔄 Iniciando carregamento do JSON de Iridaceae...");

// 2) Carrega o JSON e registra os listeners
fetch('iridaceae.json')
  .then(response => {
    if (!response.ok) throw new Error('JSON not found');
    return response.json();
  })
  .then(json => {
    mapaIridaceae = json;
    console.log("✅ JSON de Iridaceae carregado:", mapaIridaceae);
    document.querySelectorAll('svg path')
      .forEach(path => path.addEventListener('click', onEstadoClick));
    console.log("🗺️ Listeners de clique registrados em todos os estados.");
  })
  .catch(error => {
    console.error("❌ Falha ao carregar o JSON de Iridaceae:", error);
  });

function onEstadoClick() {
  const estadoId = this.id;
  console.log("\n🖱️ Estado clicado:", estadoId);

  if (!(estadoId in estadosBrasileiros)) {
    console.warn("⚠️ Sigla de estado não reconhecida:", estadoId);
    alert("Estado não encontrado.");
    return;
  }

  const nomeEstado = estadosBrasileiros[estadoId];
  console.log("📍 Nome do estado:", nomeEstado);

  // 3) Monta a URL da API do GBIF
  const GBIF_API = "https://api.gbif.org/v1/occurrence/search";
  const params = {
    familyKey: 7698,
    stateProvince: nomeEstado,
    limit: 200,
    mediaType: "StillImage"
  };
  const apiUrl = `${GBIF_API}?${new URLSearchParams(params).toString()}`;
  console.log("🌐 URL da requisição GBIF:", apiUrl);

  // 4) Faz a requisição ao GBIF
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

      // 5) Processa resultados em um dicionário único
      const especiesDict = {};
      data.results.forEach((occ, idx) => {
        console.log(`🔍 Ocorrência ${idx + 1}:`, occ);
        const especie = occ.species;
        if (!especie || especiesDict[especie]) return;

        // puxa a foto de media ou de extensão
        let foto = null;
        if (Array.isArray(occ.media) && occ.media.length) {
          foto = occ.media[0].identifier;
        } else if (
          occ.extensions &&
          occ.extensions["http://rs.gbif.org/terms/1.0/Multimedia"]?.length
        ) {
          foto = occ.extensions["http://rs.gbif.org/terms/1.0/Multimedia"][0]
                   ["http://purl.org/dc/terms/identifier"];
        }

        especiesDict[especie] = {
          scientificName: especie,
          genus:          occ.genericName || occ.genus,
          species:        occ.specificEpithet || occ.species,
          date:           occ.eventDate,
          locality:       occ.verbatimLocality || occ.locality,
          lat:            occ.decimalLatitude,
          lon:            occ.decimalLongitude,
          license:        occ.license,
          photoUrl:       foto,
          recordBy:       occ.recordedBy,
          basis:          occ.basisOfRecord
        };
        console.log("➕ Adicionada espécie:", especie, foto);
      });

      // 6) Filtra pela lista oficial do JSON
      const sigla = estadoId.split('-')[1];
      const validas = mapaIridaceae?.[sigla] || [];
      const normValidas = validas.map(s => s.trim().toLowerCase());
      const todasEsp = Object.values(especiesDict);
      const filtradas = todasEsp.filter(e =>
        normValidas.includes(e.scientificName.toLowerCase())
      );
      console.log("🔖 Espécies filtradas:", filtradas);

      // 7) Renderiza os cards + card extra
      resultadoDiv.innerHTML = `
        <h3>Iridaceae em ${nomeEstado}</h3>
        <div class="grid-container">
          ${filtradas.map(e => `
            <div class="card">
              ${e.photoUrl ? `<img src="${e.photoUrl}" alt="${e.species}">` : ''}
              <p><strong>Nome científico:</strong> ${e.scientificName}</p>
              <p><strong>Localidade:</strong> ${e.locality}</p>
              <p><strong>Coletado por:</strong> ${e.recordBy}</p>
            </div>
          `).join('')}

          <div class="card json-models-card">
            <h4>Todas as espécies registradas</h4>
            <ul>${validas.map(m => `<li>${m}</li>`).join('')}</ul>
          </div>
        </div>
      `;

      // 8) Plota pontos destacados em azul
      const highlights = filtradas
        .filter(e => typeof e.lat === 'number' && typeof e.lon === 'number')
        .map(e => ({ lat: e.lat, lon: e.lon }));
      console.log("🔵 Destaques:", highlights);
      plotHighlightedPoints(highlights);
    })
    .catch(err => {
      console.error("❌ Erro GBIF:", err);
      document.getElementById("resultado")
        .innerHTML = `<p style="color:red;">Erro ao consultar a API.</p>`;
    });''
}

// Coordenadas de referência para todo o Brasil
const bboxBR = {
  minLon: -80, maxLon: -32,
  minLat: -35, maxLat:   6
};

// 9) Plota todos os pontos “verdes” (amostragem de 10%) ao carregar
function fetchCoordinates(nomeEstado) {
  const API = "https://api.gbif.org/v1/occurrence/search";
  const base = { familyKey: 7698, stateProvince: nomeEstado, hasCoordinate: true };
  // 1ª chamada só para contar
  const c1 = new URLSearchParams({ ...base, limit: 1 });
  return fetch(`${API}?${c1}`)
    .then(r => r.json())
    .then(json => {
      const total = json.count || 0;
      const sample = Math.max(1, Math.ceil(total * 0.1));  // 10%
      console.log(`→ ${nomeEstado}: ${total} totais, amostrando ${sample}`);
      const c2 = new URLSearchParams({ ...base, limit: sample });
      return fetch(`${API}?${c2}`)
        .then(r2 => r2.json())
        .then(j2 =>
          (j2.results || [])
            .map(o => ({ lat: o.decimalLatitude, lon: o.decimalLongitude }))
            .filter(p => typeof p.lat === "number" && typeof p.lon === "number")
        );
    });
}

function plotPoints(points) {
  const svg = document.querySelector("#map svg");
  const vb  = svg.viewBox.baseVal;
  points.forEach(({lat, lon}) => {
    const x = (lon - bboxBR.minLon) / (bboxBR.maxLon - bboxBR.minLon) * vb.width;
    const y = (bboxBR.maxLat - lat) / (bboxBR.maxLat - bboxBR.minLat) * vb.height;
    const c = document.createElementNS(svg.namespaceURI, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", 2);
    c.setAttribute("fill", "green");
    // desativa o clique
    c.setAttribute("pointer-events", "none");
    svg.appendChild(c);
  });
}

function plotHighlightedPoints(points) {
  const svg = document.querySelector("#map svg");
  const vb  = svg.viewBox.baseVal;
  // limpa antigos destaques
  svg.querySelectorAll("circle.highlight-point").forEach(n => n.remove());
  points.forEach(({lat, lon}) => {
    const x = (lon - bboxBR.minLon) / (bboxBR.maxLon - bboxBR.minLon) * vb.width;
    const y = (bboxBR.maxLat - lat) / (bboxBR.maxLat - bboxBR.minLat) * vb.height;
    const c = document.createElementNS(svg.namespaceURI, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", 3);
    c.setAttribute("fill", "blue");
    c.classList.add("highlight-point");
    // desativa o clique
    c.setAttribute("pointer-events", "none");
    svg.appendChild(c);
  });
}

// 10) No load, amostragem e plotagem inicial
document.addEventListener("DOMContentLoaded", () => {
  Object.values(estadosBrasileiros).forEach(nomeEstado => {
    fetchCoordinates(nomeEstado)
      .then(cs => {
        console.log(`→ ${nomeEstado}: plotando ${cs.length} ponto(s).`);
        plotPoints(cs);
      })
      .catch(err => console.error(`Erro ao buscar ${nomeEstado}:`, err));
  });
});
