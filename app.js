document.addEventListener("DOMContentLoaded", function () {
    const estados = document.querySelectorAll("svg path");

    estados.forEach(estado => {
        estado.addEventListener("click", function () {
            const estadoId = this.id;

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

            // Verifica se a sigla do estado é válida
            if (!(estadoId in estadosBrasileiros)) {
                alert("Estado não encontrado.");
                return;
            }

            const nomeEstado = estadosBrasileiros[estadoId];

            // API do GBIF
            const GBIF_OCCURRENCE_API = "https://api.gbif.org/v1/occurrence/search";

            // Parâmetros para a consulta
            const params = {
                familyKey: 7698,  // Código da família Iridaceae
                stateProvince: nomeEstado,
                limit: 100,       // Limite de registros retornados
                mediaType: "StillImage" // Filtra por ocorrências com imagens
            };

            // Converte os parâmetros para query string
            const queryString = new URLSearchParams(params).toString();
            const apiUrl = `${GBIF_OCCURRENCE_API}?${queryString}`;

            // Faz a requisição usando fetch (AJAX)
            fetch(apiUrl)
                .then(response => response.json())  // Transforma a resposta em JSON
                .then(data => {
                    const resultadoDiv = document.getElementById("resultado");

                    if (data.results && data.results.length > 0) {
                        const especiesDict = {};

                        // Processa os resultados da API
                        data.results.forEach(occ => {
                            const genero = occ.genus;
                            const especie = occ.species;
                            if (genero && especie) {
                                const key = `${genero} ${especie}`;
                                if (!especiesDict[key]) {
                                    let foto = null;
                                    if (occ.media && occ.media.length > 0) {
                                        foto = occ.media[0].identifier;
                                    }
                                    especiesDict[key] = {
                                        genero: genero,
                                        especie: especie,
                                        foto: foto
                                    };
                                }
                            }
                        });

                        const especiesIgnoradas = [
                            "Babiana fragrans",
                            "Chasmanthe aethiopica",
                            "Orthrosanthus chimboracensis"
                          ];

                        const especiesLista = Object.values(especiesDict);
                        // Exibe as espécies no HTML

                        const especiesListaFiltrada = especiesLista.filter(especie => 
                            !especiesIgnoradas.includes(`${especie.genero} ${especie.especie}`)
                          );
                          
                        resultadoDiv.innerHTML = `
                            <h3>Espécies encontradas no estado: ${nomeEstado}</h3>
                            <div class="grid-container">
                                 ${especiesListaFiltrada.map(especie => `
                                    <div class="card">
                                        <img src="${especie.foto}" alt="${especie.especie}">
                                        <p><strong>${especie.especie}</strong></p>
                                        <p>Gênero: ${especie.genero}</p>
                                    </div>
                                `).join("")}
                            </div>
                        `;
                    } else {
                        resultadoDiv.innerHTML = `<p>Não foram encontradas espécies para este estado.</p>`;
                    }
                })
                .catch(error => {
                    console.error("Erro na requisição:", error);
                    const resultadoDiv = document.getElementById("resultado");
                    resultadoDiv.innerHTML = `<p style="color:red;">Erro ao consultar a API.</p>`;
                });
        });
    });
});
