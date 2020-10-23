import React from 'react';
import './App.css';

/* 

3) tabela: tirar as linhas brancas

4) tabela: alinhar icones 
*/

/**
 * reordena a tabela de classificação por outros parâmetros
 * @param {array} tabelaAntiga 
 * @param {string} parametro 
 */
const reordenarTabela = (tabelaAntiga, parametro) => {
	const tabelaNova = tabelaAntiga.sort((a, b) => {
		if (parametro === 'time') {
			return a['time'].localeCompare(b['time']);
		} else {
			return b[parametro] - a[parametro];
		}
	});
	return tabelaNova;
};


/**
 * faz uma requisição com body
 * @param {string} url 
 * @param {string} metodo 
 * @param {object} conteudo 
 * @param {string} token 
 */
function fazerRequisicaoComBody(url, metodo, conteudo, token) {
    return fetch(url, {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
            Authorization: token && `Bearer ${token}`,
        },
        body: JSON.stringify(conteudo),
    });
}



function App() {
	const [rodada, setRodada] = React.useState(1);
	const [jogosDaRodada, setJogosDaRodada] = React.useState([]);
	const [tabela, setTabela] = React.useState([]);
	const [logado, setLogado] = React.useState(undefined);
	const [email, setEmail] = React.useState('');
	const [senha, setSenha] = React.useState('');
	const [editando, setEditando] = React.useState(null)
	const [correcao, setCorrecao] = React.useState({id: null, golsCasa: null, golsVisitante: null})

		
	/**
	 * fetch para buscar os jogos da rodada
	 * @param {number} numeroDaRodada 
	 */
	const buscarJogosDaRodada = (numeroDaRodada) => {
		fetch(`http://127.0.0.1:1908/rodada/${numeroDaRodada}`)
		.then(resposta => resposta.json())
		.then(respostaJson => { setJogosDaRodada(respostaJson.dados.jogosDaRodada) });
	};

	// faz um fetch sempre que for passada a rodada
	React.useEffect(() => {
		buscarJogosDaRodada(rodada);
	}, [rodada]);
	 

	// faz um fetch para buscar a tabela de pontuação atualizada
	const fetchTabela = () => {
		fetch('http://127.0.0.1:1908/classificacao')
			.then(resposta => resposta.json())
			.then(respostaJson => { setTabela(respostaJson.dados.tabelaOrdenada)  });
	}

	// faz um fetch para buscar a tabela de pontuação quando a página for aberta
	React.useEffect(() => {
		fetchTabela()
	}, []);


	/**
	 * faz o fetch para inicar a sessão do usuário
	 * @param {*} event 
	 */
	const onSubmit = async (event) => {
			event.preventDefault();
			
			if (logado) {
				setLogado(undefined)
			} else {
				try {
					const respostaLogin = await fazerRequisicaoComBody(
						'http://127.0.0.1:1908/auth', 
						'POST', 
						{ email, senha })
					.then((resposta) => resposta.json());
					
					if (respostaLogin.dados && respostaLogin.dados.token) {
						setLogado(respostaLogin.dados.token)
						setEmail('')
						setSenha('')
					} else if (respostaLogin.dados) {
						alert(respostaLogin.dados.mensagem)
					}
				} catch (err) {
					console.log(err.message)
				}
			}
	}
	
	/**
	 * faz um fetch para atualizar o placar do jogo no banco de dados, ja atualizando a tabela de pontuação
	 * @param {*} event 
	 */
	const editarPlacar = (correcao) => {
		fazerRequisicaoComBody(
			'http://127.0.0.1:1908/jogos',
			'PUT',
			correcao,
			logado
		).then(resposta => resposta.json())
		.then(respostaJson => {
			jogosDaRodada.forEach((jogo, indice) => {
				console.log( respostaJson)
				console.log(jogo)
				if (jogo.id === respostaJson.dados.jogoAtualizado.id) {
					jogosDaRodada[indice].gols_casa = respostaJson.dados.jogoAtualizado.gols_casa
					jogosDaRodada[indice].gols_visitante = respostaJson.dados.jogoAtualizado.gols_visitante
				} 
			} )
			
			const rodadaEditada = [...jogosDaRodada]
			return rodadaEditada
		}).then(rodadaEditada => {
			setJogosDaRodada(rodadaEditada)
			fetchTabela();
			setEditando(null);
		}) 	
	}

	return (
    <div className="App">
    	<div className='header'>
    		<h1>Brasileirão</h1>

       		<form method='post' onSubmit={onSubmit}>
				{!logado && (
          		<label
					hidden={!logado ? true : false}>
            		Email
					<input 
						type='email'
						value={email}
						onInput={(event) => {setEmail(event.target.value)}} ></input>
        	  	</label>
				  )}
				  {!logado && (
          		<label
				  	hidden={logado ? true : false}>
        			Senha
					<input 
						type='password'
						value={senha}
						onInput={(event) => {setSenha(event.target.value)}}></input>
      			</label>
				  )}
        		<button>{!logado ? 'Logar' : 'Deslogar'}</button>
        	</form>
      	</div>
      	<div className='conteiner'>
        	<div className='rodada'>
          		<div className='rodada-header'>
					<img 
						src=' https://systemuicons.com/images/icons/arrow_left.svg' 
						alt='Seta para a esquerda'
						onClick={() => rodada > 1 ? setRodada(rodada - 1) : 1 }/>
					<h2>{rodada}a rodada</h2>
					<img 
						src=' https://systemuicons.com/images/icons/arrow_right.svg' 
						alt='Seta para a direita'
						onClick={() => rodada < 38 ? setRodada(rodada + 1) : 38 } />
          		</div>
				<table className='tabela-da-rodada'>
					{!jogosDaRodada ? 'Carregando...' : jogosDaRodada.map((jogo, indice) => (
						<tr key={jogo.id}>
							<td className='casa'>{jogo.time_casa}</td>
							<td className='placar'>
								{editando === indice ?
								<input 
									type='number'
									value={correcao.golsCasa}
									onChange={event => {
										setCorrecao({...correcao, golsCasa: event.target.value})
									}} ></input> : jogo.gols_casa}</td>
							<td>x</td>
							<td className='placar'>
								{editando === indice ? 
								<input 
									type='number' 
									value={correcao.golsVisitante}
									onChange={(event) => {
											setCorrecao({...correcao, golsVisitante: event.target.value})
									}} ></input> : jogo.gols_visitante}</td>
							<td className='visitante'>{jogo.time_visitante}</td>
							{logado && (
							<td>
								<img 
									src={editando === indice ? 
										'https://systemuicons.com/images/icons/check.svg' : 
										'https://systemuicons.com/images/icons/pen.svg'} 
									alt='Botao para editar'
									onClick={() => {
										if (editando !== indice) {
											setEditando(indice)
											setCorrecao({id: jogo.id, golsCasa: jogo.gols_casa, golsVisitante: jogo.gols_visitante})
										} else {
											editarPlacar(correcao)
										}
										
									}} />
							</td>
							)}
						</tr>
					))}	
				</table>
        	</div>
        	<table className='tabela'>
          		<tr>
					<td>
					Colocação
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'colocacao');
							const novaTabela = [...tabela]
							setTabela(novaTabela)
						}} />
					</td>
					<td>
					Time
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'time');
							const novaTabela = [...tabela]
							setTabela(novaTabela)
						}} />
					</td>
					<td>
					PTS
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'pontos');
							const novaTabela = [...tabela]
							setTabela(novaTabela)
						}} />
					</td>
					<td>
					E
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'empates');
							const novaTabela = [...tabela]
							setTabela(novaTabela);
						}} />
					</td>
					<td>
					V
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'vitorias');
							const novaTabela = [...tabela]
							setTabela(novaTabela)
						}} />
					</td>
					<td>
					D
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'derrotas');
							const novaTabela = [...tabela]
							setTabela(novaTabela)
						}} />
					</td>
					<td>
					GF
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'golsFeitos');
							const novaTabela = [...tabela]
							setTabela(novaTabela)
						}} />
					</td>
					<td>
					GS
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'golsSofridos');
							const novaTabela = [...tabela]
							setTabela(novaTabela)
						}} />
					</td>
					<td>
					SG
					<img 
						src='https://systemuicons.com/images/icons/sort.svg' 
						alt='botao para ordernar'
						onClick={() => { 
							reordenarTabela(tabela, 'saldoDeGols');
							const novaTabela = [...tabela]
							setTabela(novaTabela)
						}} />
					</td>
				</tr>
				{(!tabela ? 'Carregando...' : tabela.map(time => (
					<tr>
						<td>{time.colocacao}</td>
						<td>{time.time}</td>
						<td>{time.pontos}</td>
						<td>{time.empates}</td>
						<td>{time.vitorias}</td>
						<td>{time.derrotas}</td>
						<td>{time.golsFeitos}</td>
						<td>{time.golsSofridos}</td>
						<td>{time.saldoDeGols}</td>
					</tr>
				)))}
			</table>
      	</div>
    </div>
  	);
}

export default App;
 