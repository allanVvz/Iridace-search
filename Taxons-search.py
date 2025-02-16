import requests
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

taxon_urls = {
    "BR-RS": "https://list.worldfloraonline.org/wfo-0000548202",
    "BR-RJ": "https://list.worldfloraonline.org/wfo-0000548202",
    "BR-MT": "https://list.worldfloraonline.org/wfo-0000615907"  # URL do Mato Grosso
}

@app.route('/taxon/<estado>', methods=['GET'])
def get_taxon(estado):
    if estado not in taxon_urls:
        return jsonify({"erro": "Estado não encontrado"}), 404

    taxon_url = taxon_urls[estado]

    headers = {"Accept": "application/json"}

    try:
        # 🔥 Faz a requisição seguindo redirecionamentos (igual ao `-L` no cURL)
        response = requests.get(taxon_url, headers=headers, allow_redirects=True)

        # 🚨 Se a resposta não for 200, retorna erro
        if response.status_code != 200:
            return jsonify({"erro": "Falha ao obter os dados", "status": response.status_code}), 500

        # 🔍 Retorna o JSON corretamente
        return jsonify(response.json())

    except requests.exceptions.JSONDecodeError:
        return jsonify({"erro": "Resposta não é um JSON válido"}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({"erro": f"Erro na requisição: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
