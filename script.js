const resultadoDiv = document.getElementById('resultado');

async function buscarCNPJ() {
    const cnpjInput = document.getElementById('cnpj').value;
    const cnpjFormatado = cnpjInput.replace(/\D+/g, '');

    if (cnpjFormatado.length !== 14) {
        resultadoDiv.textContent = 'CNPJ inválido';
        return;
    }

    const url = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://receitaws.com.br/v1/cnpj/${cnpjFormatado}`)}`;

    try {
        const response = await fetch(url);
        if (response.status === 429) {
            mostrarErro('Muitas requisições! Aguarde um minuto antes de tentar novamente.');
            return;
        }
        if (response.status === 504) {
            mostrarErro('A consulta demorou muito e foi interrompida. Tente novamente mais tarde.');
            return;
        }
        if (!response.ok) {
            throw new Error(`Erro ao buscar CNPJ (Código ${response.status})`);
        }
        const data = await response.json();
        const cnpjData = JSON.parse(data.contents);

        if (cnpjData.status === 'ERROR') {
            mostrarErro('CNPJ não encontrado ou inválido.');
            return;
        }

        mostrarResultado(cnpjData);
    } catch (error) {
        mostrarErro('Erro inesperado ao buscar CNPJ. Tente novamente.');
        console.error(error);
    }

}

function mostrarResultado(data) {
    resultadoDiv.innerHTML = `
        <p><strong>Nome:</strong> ${data.nome}</p>
        <p><strong>Fantasia:</strong> ${data.fantasia}</p>
        <p><strong>Atividade Principal:</strong> ${data.atividade_principal[0].text}</p>
        <p><strong>UF:</strong> ${data.uf}</p>
        <p><strong>Município:</strong> ${data.municipio}</p>
        <p><strong>Endereço:</strong> ${data.logradouro}, ${data.numero}</p>
        <p><strong>Telefone:</strong> ${data.telefone}</p>
        <p><strong>Situação:</strong> ${data.situacao}</p>
    `;
}
