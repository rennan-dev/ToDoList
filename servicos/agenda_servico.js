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
        console.log('erro primordial');
        return res.render('cadastro', { erro: 'Por favor, preencha todos os campos.' });
    }

    if (senha != confirmarSenha) {
        console.log('erro de senha');
        return res.render('cadastro', { erro: 'Senha e Confirmar senha precisam estar iguais.' });
    }

    const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
    const values = [nome, email, senha];

    conexao.query(sql, values, function(err, result) {
        if (err) {
            console.log('erro 1');
            return console.error('Erro ao executar consulta:', err.message);
        }

        // Armazenar informações do usuário na sessão
        req.session.usuario = {
            nome: nome,
            email: email
        };

        console.log('Novo usuário inserido com sucesso!');

        res.redirect('/pagina_principal');
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
                nome: nome
            };
            res.redirect('/pagina_principal');
        } else {
            res.render('login', { erro: 'Credenciais inválidas. Por favor, tente novamente.' });
        }
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
    login_usuario
};