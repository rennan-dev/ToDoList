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
        res.render('pagina_principal', { usuario: req.session.usuario });
    } else {
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
            req.session.usuario = {
                email: email,
                nome: nome,
                projeto_selecionado: 'Hoje'
            };
            res.render('pagina_principal', { session: req.session });
        } else {
            res.render('login', { erro: 'Credenciais inválidas. Por favor, tente novamente.' });
        }
    });
}

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

function listarProjetos(req, res) {
    // Consulta ao banco de dados para obter os projetos cadastrados
    const sql = 'SELECT nome FROM projetos WHERE usuario_nome = ?'; // Adapte conforme a sua estrutura de dados
    const usuario = req.session.usuario; // Acesse as informações do usuário da sessão

    conexao.query(sql, [usuario.nome], (err, results) => {
        if (err) {
            console.error("Erro ao buscar projetos:", err);
            return res.status(500).json({ erro: 'Erro ao buscar projetos' });
        }

        // Enviar os resultados como resposta JSON
        res.status(200).json({ projetos: results });
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
    listarProjetos
};