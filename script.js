const resultadoDiv = document.getElementById('resultado');
const loadingDiv = document.createElement('div');
loadingDiv.className = 'loading';
loadingDiv.innerHTML = '<div class="spinner"></div><p>Consultando CNPJ...</p>';
document.querySelector('.container').insertBefore(loadingDiv, resultadoDiv);

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;

async function buscarCNPJ(retryCount = 0) {
    const cnpjInput = document.getElementById('cnpj').value;
    const cnpjFormatado = cnpjInput.replace(/\D+/g, '');

    resultadoDiv.innerHTML = '';
    resultadoDiv.classList.remove('active');
    
    if (cnpjFormatado.length !== 14) {
        mostrarErro('CNPJ inválido', 'Por favor, insira um CNPJ com 14 dígitos.');
        return;
    }
    
    loadingDiv.classList.add('active');

    const url = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://receitaws.com.br/v1/cnpj/${cnpjFormatado}`)}`;

    try {
        const response = await fetch(url);
        
        if (response.status === 400) {
            loadingDiv.classList.remove('active');
            mostrarErro('CNPJ Inválido', 'Verifique o número e tente novamente.');
            return;
        }
        
        if (response.status === 404) {
            loadingDiv.classList.remove('active');
            mostrarErro('CNPJ Não Encontrado', 'Este CNPJ não foi encontrado na base de dados da Receita Federal.');
            return;
        }
        
        if (response.status === 429) {
            loadingDiv.classList.remove('active');
            mostrarErro('Limite Excedido', 'Muitas requisições em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.');
            return;
        }
        
        if ((response.status === 500 || response.status === 504) && retryCount < MAX_RETRIES) {
            const novaContagem = retryCount + 1;
            mostrarMensagemRetry(novaContagem, MAX_RETRIES);
            
            setTimeout(() => {
                buscarCNPJ(novaContagem);
            }, RETRY_DELAY);
            return;
        }
        
        if ((response.status === 500 || response.status === 504) && retryCount >= MAX_RETRIES) {
            loadingDiv.classList.remove('active');
            mostrarErro('Erro no Servidor', `Não foi possível obter resposta após ${MAX_RETRIES} tentativas. Por favor, tente novamente mais tarde.`);
            return;
        }
        
        // Para qualquer outro erro
        if (!response.ok) {
            loadingDiv.classList.remove('active');
            mostrarErro('Erro na Consulta', `Ocorreu um erro ao buscar o CNPJ (Código ${response.status})`);
            return;
        }
        
        const data = await response.json();
        const cnpjData = JSON.parse(data.contents);

        loadingDiv.classList.remove('active');

        if (cnpjData.status === 'ERROR') {
            mostrarErro('Erro na Consulta', cnpjData.message || 'CNPJ não encontrado ou inválido.');
            return;
        }

        mostrarResultado(cnpjData);
    } catch (error) {
        loadingDiv.classList.remove('active');
        mostrarErro('Erro Inesperado', 'Ocorreu um problema ao processar sua solicitação. Tente novamente.');
    }
}

function mostrarMensagemRetry(tentativa, maxTentativas) {
    loadingDiv.innerHTML = `
        <div class="spinner"></div>
        <p>Erro no servidor. Tentando novamente... (${tentativa}/${maxTentativas})</p>
    `;
}

function mostrarErro(titulo, mensagem) {
    resultadoDiv.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="error-content">
                <h3 class="error-title">${titulo}</h3>
                <p class="error-message">${mensagem}</p>
            </div>
        </div>
    `;
    resultadoDiv.classList.add('active');
}

function mostrarResultado(data) {
    resultadoDiv.innerHTML = `
        <div class="company-info">
            <div class="company-header">
                <span class="company-name">${data.nome}</span>
                <span class="company-status ${data.situacao === 'ATIVA' ? 'status-active' : 'status-inactive'}">${data.situacao}</span>
            </div>
            <div class="info-row">
                <span class="info-label">CNPJ:</span>
                <span>${data.cnpj}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Nome Fantasia:</span>
                <span>${data.fantasia || 'Não informado'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Abertura:</span>
                <span>${data.abertura}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Endereço:</span>
                <span>${data.logradouro}, ${data.numero} ${data.complemento ? '- ' + data.complemento : ''}, ${data.bairro}, ${data.municipio}/${data.uf}, CEP: ${data.cep}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Atividade:</span>
                <span>${data.atividade_principal[0].text}</span>
            </div>
        </div>
    `;
    resultadoDiv.classList.add('active');
}