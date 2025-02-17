document.addEventListener("DOMContentLoaded", function () {
    const estados = document.querySelectorAll("svg path");

    estados.forEach(estado => {
        estado.addEventListener("click", function () {
            const estadoId = this.id;

            fetch(`http://127.0.0.1:5000/taxon/${estadoId}`, { method: "GET" })
                .then(response => response.json())
                .then(data => {
                    const resultadoDiv = document.getElementById("resultado");

                    if (data.erro) {
                        resultadoDiv.innerHTML = `<p style="color:red;">${data.erro}</p>`;
                    } else {
                        const especies = data.especies || [];

                        resultadoDiv.innerHTML = `
                            <h3>Espécies encontradas no estado: ${data.estado}</h3>
                            <div class="grid-container">
                                ${especies.map(especie => `
                                    <div class="card">
                                        <img src="${especie.foto}" alt="${especie.especie}">
                                        <p><strong>${especie.especie}</strong></p>
                                        <p>Gênero: ${especie.genero}</p>
                                    </div>
                                `).join("")}
                            </div>
                        `;
                    }
                })
                .catch(error => console.error("Erro na requisição:", error));
        });
    });
});
