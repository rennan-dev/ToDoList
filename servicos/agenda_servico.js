// Importar o módulo de conexão com banco MySQL
const conexao = require('../banco_de_dados/conexao');

function pagina_inicial(req, res){
    res.render('pagina_inicial');
}

function pagina_login(req, res){
    res.render('login');
}

function pagina_cadastro(req, res){
    res.render('cadastro');
}

function cadastrar_novo_usuario(req, res) {
    const nome = req.body.nome;
    const email = req.body.email;
    const senha = req.body.senha;
    const confirmarSenha = req.body.confirmarSenha;

    if (!nome || !email || !senha || !confirmarSenha) {
        console.log('Erro primordial');
        return res.render('cadastro', { erro: 'Por favor, preencha todos os campos.' });
    }

    if (senha != confirmarSenha) {
        console.log('Erro de senha');
        return res.render('cadastro', { erro: 'Senha e Confirmar senha precisam estar iguais.' });
    }

    const sqlInsertUsuario = "INSERT INTO usuarios (nome, email, senha, projeto_selecionado) VALUES (?, ?, ?, ?)";
    const valuesUsuario = [nome, email, senha, 'Hoje'];

    conexao.query(sqlInsertUsuario, valuesUsuario, function(err, result) {
        if (err) {
            console.log('Erro ao inserir novo usuário:', err.message);
            return res.render('cadastro', { erro: 'Erro ao criar conta.' });
        }

        // Criação do projeto 'Hoje' para o novo usuário
        const sqlInsertProjeto = "INSERT INTO projetos (nome, usuario_nome) VALUES (?, ?)";
        const valuesProjeto = ['Hoje', nome];

        conexao.query(sqlInsertProjeto, valuesProjeto, function(err, result) {
            if (err) {
                console.log('Erro ao criar projeto "Hoje":', err.message);
                return res.render('cadastro', { erro: 'Erro ao criar conta.' });
            }

            console.log('Novo usuário e projeto "Hoje" criados com sucesso!');
            req.session.usuario = {
                nome: nome,
                email: email,
                projeto_selecionado: 'Hoje'
            };

            res.redirect('/pagina_principal');
        });
    });
}

function pagina_principal(req, res){
    // Verificar se o usuário está autenticado
    if (req.session && req.session.usuario) {
        const emailUsuario = req.session.usuario.email;

        // Consulta MySQL para obter o projeto selecionado do usuário
        const sql = 'SELECT projeto_selecionado FROM usuarios WHERE email = ?';
        const values = [emailUsuario];

        conexao.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao executar consulta:', err);
                res.status(500).send('Erro ao obter o projeto selecionado do usuário');
                return;
            }

            if (results.length > 0) {
                // Projeto selecionado encontrado
                const projetoSelecionado = results[0].projeto_selecionado;
                // Renderiza a página principal com os dados do usuário e o projeto selecionado
                res.render('pagina_principal', { usuario: req.session.usuario, projetoSelecionado: projetoSelecionado });
            } else {
                // Projeto selecionado não encontrado
                res.status(404).send('Projeto selecionado não encontrado para o usuário');
            }
        });
    } else {
        // Usuário não autenticado, redireciona para a página de login
        res.redirect('/login');
    }
}


function logout(req, res) {
    // Destrua a sessão
    req.session.destroy(function(err) {
        if (err) {
            console.error('Erro ao encerrar a sessão:', err);
            res.status(500).send('Erro ao encerrar a sessão');
        } else {
            // Redirecione para a página de login ou para a página inicial
            res.redirect('/login'); // ou qualquer outra página que você deseja redirecionar após sair
        }
    });
}

function login_usuario(req, res) {
    const email = req.body.email;
    const senha = req.body.senha;

    const sql = 'SELECT nome FROM usuarios WHERE email = ? AND senha = ?';
    const values = [email, senha];

    conexao.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao executar consulta:', err);
            res.status(500).send('Erro ao autenticar usuário');
            return;
        }

        if (results.length > 0) {
            // Armazene o nome do usuário na sessão
            const nome = results[0].nome;
            // Atualizar o projeto selecionado no banco de dados
            const sqlUpdateProjetoSelecionado = 'UPDATE usuarios SET projeto_selecionado = ? WHERE email = ?';
            const valuesUpdateProjetoSelecionado = ['Hoje', email];
            conexao.query(sqlUpdateProjetoSelecionado, valuesUpdateProjetoSelecionado, (err, results) => {
                if (err) {
                    console.error('Erro ao atualizar projeto selecionado:', err);
                    res.status(500).send('Erro ao atualizar projeto selecionado');
                    return;
                }
                console.log('Projeto selecionado atualizado com sucesso');
                // Armazenar informações do usuário na sessão
                req.session.usuario = {
                    email: email,
                    nome: nome
                };
                // Redirecionar para a página principal
                res.redirect('/pagina_principal');
            });
        } else {
            res.render('login', { erro: 'Credenciais inválidas. Por favor, tente novamente.' });
        }
    });
}
//res.redirect('/pagina_principal');
//res.render('pagina_principal', { session: req.session });

function adicionar_projeto(req, res) {
    const nome = req.body.nome;
    const usuario = req.session.usuario; // Acesse as informações do usuário da sessão

    if (!nome || !usuario) {
        console.log("Erro primordial");
        return res.status(400).json({ erro: 'Por favor, preencha todos os campos' });
    }

    // Inserir os dados diretamente na tabela de projetos
    const sql = 'INSERT INTO projetos (nome, usuario_nome) VALUES (?, ?)';
    const values = [nome, usuario.nome];

    conexao.query(sql, values, (err, results) => {
        if (err) {
            console.error("Erro ao adicionar projeto:", err);
            // Lidar com o erro, por exemplo, retornar uma mensagem de erro na resposta JSON
            return res.status(500).json({ erro: 'Erro ao adicionar projeto' });
        }
        
        console.log("Projeto adicionado com sucesso");
        // Retornar uma mensagem de sucesso na resposta JSON
        res.status(200).json({ mensagem: 'Projeto adicionado com sucesso' });
    });
}

//verificar se o usuarioestá logado
// function verificarSessao(req, res, next) {
//     if (req.session && req.session.usuario) {
//         // O usuário está autenticado
//         next();
//     } else {
//         // O usuário não está autenticado, redirecionar para a página de login
//         res.redirect('/login');
//     }
// }

function obterProjetoSelecionadoUsuario(email, callback) {
    const sql = 'SELECT projeto_selecionado FROM usuarios WHERE email = ?';
    const values = [email];

    conexao.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao executar consulta:', err);
            callback(err, null);
            return;
        }
        
        if (results.length > 0) {
            callback(null, results[0].projeto_selecionado);
        } else {
            callback(new Error('Usuário não encontrado'), null);
        }
    });
}

// Exportar funções
module.exports = {
    pagina_inicial,
    pagina_login,
    pagina_cadastro,
    cadastrar_novo_usuario, 
    pagina_principal,
    logout,
    login_usuario,
    adicionar_projeto,
    obterProjetoSelecionadoUsuario
};