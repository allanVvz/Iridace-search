document.addEventListener("DOMContentLoaded", function () {
    const estados = document.querySelectorAll("svg path");
    const resultadoDiv = document.getElementById("resultado");
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");
    document.body.appendChild(tooltip);

    estados.forEach(estado => {
        estado.addEventListener("mouseenter", function (event) {
            tooltip.textContent = this.getAttribute("data-name") || this.id;
            tooltip.style.left = `${event.pageX}px`;
            tooltip.style.top = `${event.pageY - 40}px`;
            tooltip.classList.add("active");
        });

        estado.addEventListener("mouseleave", function () {
            tooltip.classList.remove("active");
        });

        estado.addEventListener("click", function () {
            const estadoId = this.id;
            fetch(`http://127.0.0.1:5000/taxon/${estadoId}`)
                .then(response => response.json()) 
                .then(data => {
                    resultadoDiv.innerHTML = ""; // Limpa o conteúdo anterior

                    if (data.erro) {
                        resultadoDiv.innerHTML = `<p class="erro">${data.erro}</p>`;
                        return;
                    }

                    const container = document.createElement("div");
                    container.classList.add("json-container");

                    // Pega apenas os campos essenciais
                    const nomeCompleto = data["https://list.worldfloraonline.org/wfo-0000548202"]?.["https://list.worldfloraonline.org/terms/fullName"]?.[0]?.value || "Não disponível";
                    const autor = data["https://list.worldfloraonline.org/wfo-0000548202"]?.["https://list.worldfloraonline.org/terms/authorship"]?.[0]?.value || "Não disponível";
                    const genero = data["https://list.worldfloraonline.org/wfo-0000548202"]?.["https://list.worldfloraonline.org/terms/genusName"]?.[0]?.value || "Não disponível";
                    const citacao = data["https://list.worldfloraonline.org/wfo-0000548202"]?.["https://list.worldfloraonline.org/terms/publicationCitation"]?.[0]?.value || "Não disponível";
                    
                    // Obtendo referências
                    const referencias = data["https://list.worldfloraonline.org/wfo-0000548202"]?.["http://purl.org/dc/terms/references"] || [];
                    let referenciasHtml = referencias.length > 0 ? "<ul>" : "<p>Não disponível</p>";
                    referencias.forEach(ref => {
                        referenciasHtml += `<li><a href="${ref.value}" target="_blank">${ref.value}</a></li>`;
                    });
                    referenciasHtml += referencias.length > 0 ? "</ul>" : "";

                    // Obtendo imagem (se disponível)
                    let imagemUrl = data["http://www.wikidata.org/entity/Q1230990"]?.["http://ogp.me/ns#image"]?.[0]?.value || "";
                    let imagemHtml = imagemUrl ? `<img src="${imagemUrl}" alt="Imagem" class="imagem">` : "<p>Sem imagem disponível</p>";

                    container.innerHTML = `
                        <h3>Dados do Táxon</h3>
                        <p><strong>Nome Completo:</strong> ${nomeCompleto}</p>
                        <p><strong>Autor:</strong> ${autor}</p>
                        <p><strong>Gênero:</strong> ${genero}</p>
                        <p><strong>Citação:</strong> ${citacao}</p>
                        <p><strong>Referências:</strong></p>
                        ${referenciasHtml}
                        <p><strong>Imagem:</strong></p>
                        ${imagemHtml}
                    `;

                    resultadoDiv.appendChild(container);
                })
                .catch(error => console.error("Erro na requisição:", error));
        });
    });
});
