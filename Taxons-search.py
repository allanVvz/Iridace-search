import requests
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Mapeamento das siglas dos estados brasileiros para seus nomes completos
estados_brasileiros = {
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
}

# Endpoint da API de ocorrências do GBIF
GBIF_OCCURRENCE_API = "https://api.gbif.org/v1/occurrence/search"

@app.route('/taxon/<sigla_estado>', methods=['GET'])
def get_taxon(sigla_estado):
    # Verifica se a sigla do estado existe no mapeamento
    if sigla_estado not in estados_brasileiros:
        return jsonify({"erro": "Estado não encontrado. Utilize uma sigla válida, ex.: BR-RS"}), 404

    # Converte a sigla para o nome completo do estado
    nome_estado = estados_brasileiros[sigla_estado]

    # Parâmetros para buscar ocorrências de Iridaceae (familyKey=7698) no GBIF
    params = {
        "familyKey": 7698,
        "stateProvince": nome_estado,
        "limit": 100,              # número de registros retornados (pode ser ajustado)
        "mediaType": "StillImage"   # opcional: filtra ocorrências com imagens
    }
    
    try:
        response = requests.get(GBIF_OCCURRENCE_API, params=params, allow_redirects=True)
        
        if response.status_code != 200:
            return jsonify({"erro": "Falha ao obter os dados", "status": response.status_code}), 500
        
        data = response.json()
        # Usaremos um dicionário para garantir que cada combinação de gênero e espécie apareça apenas uma vez
        especies_dict = {}
        
        for occ in data.get("results", []):
            # Extrai o gênero e a espécie
            genero = occ.get("genus")
            especie = occ.get("species")
            
            # Se ambos estiverem disponíveis, monta uma chave única
            if genero and especie:
                key = f"{genero} {especie}"
                # Caso ainda não exista no dicionário, adiciona com a foto
                if key not in especies_dict:
                    foto = None
                    # Se houver mídia disponível, pega a primeira imagem
                    if "media" in occ and occ["media"]:
                        foto = occ["media"][0].get("identifier")
                    especies_dict[key] = {
                        "genero": genero,
                        "especie": especie,
                        "foto": foto
                    }
        
        # Converte o dicionário para uma lista
        especies_lista = list(especies_dict.values())
        return jsonify({"estado": nome_estado, "especies": especies_lista})
    
    except requests.exceptions.JSONDecodeError:
        return jsonify({"erro": "Resposta não é um JSON válido"}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({"erro": f"Erro na requisição: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
