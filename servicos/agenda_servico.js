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

function obterProjetosUsuario(req, res) {
    // Verificar se o usuário está autenticado
    if (req.session && req.session.usuario) {
        const usuarioNome = req.session.usuario.nome;

        // Consulta MySQL para obter os projetos do usuário
        const sql = 'SELECT nome FROM projetos WHERE usuario_nome = ?';
        const values = [usuarioNome];

        conexao.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao executar consulta de projetos do usuário:', err);
                res.status(500).json({ erro: 'Erro ao obter os projetos do usuário' });
                return;
            }

            const projetosUsuario = results.map(result => result.nome);
            res.json(projetosUsuario);
        });
    } else {
        // Usuário não autenticado, responder com erro
        res.status(401).json({ erro: 'Usuário não autenticado' });
    }
}

// Função para adicionar uma nova lista de projetos
function adicionarLista(req, res) {
    const nomeLista = req.body.nome; // Obter o nome da lista do corpo da requisição
    const usuarioNome = req.session.usuario.nome; // Obter o nome do usuário da sessão

    // Verificar se o nome da lista não está vazio
    if (!nomeLista) {
        return res.status(400).json({ erro: 'O nome da lista não pode estar vazio' });
    }

    // Inserir os dados da nova lista na tabela de projetos
    const sql = 'INSERT INTO projetos (nome, usuario_nome) VALUES (?, ?)';
    const values = [nomeLista, usuarioNome];

    conexao.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao adicionar lista de projetos:', err);
            return res.status(500).json({ erro: 'Erro ao adicionar lista de projetos' });
        }

        // Redirecionar o usuário de volta para a página principal após a inserção bem-sucedida
        res.redirect('/pagina_principal');
    });
}

// Rota para selecionar um projeto
function selecionar_projeto(req, res) {
    const projetoSelecionado = req.body.projetoSelecionado;
    
    // Atualizar o campo 'projeto_selecionado' no banco de dados para o projeto selecionado
    const sql = 'UPDATE usuarios SET projeto_selecionado = ? WHERE nome = ?';
    const values = [projetoSelecionado, req.session.usuario.nome];

    conexao.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erro ao selecionar projeto:', err);
            res.status(500).json({ erro: 'Erro ao selecionar projeto' });
            return;
        }
        // Responder com sucesso
        res.status(200).send('Projeto selecionado com sucesso');
    });
}

// Função para inserir uma nova tarefa no banco de dados
function adicionarTarefa(req, res) {
    const nomeTarefa = req.body.nomeDaTarefa;

    if (!nomeTarefa) {
        console.error('O nome da tarefa não pode ser nulo.');
        return;
    }

    // Recuperar o nome do usuário logado
    const userNome = req.session.usuario.nome;

    // Consulta SQL para obter o ID do projeto do usuário logado
    const sqlProjetoId = `
        SELECT projetos.id
        FROM projetos
        INNER JOIN usuarios ON projetos.usuario_nome = usuarios.nome
        WHERE usuarios.nome = ?;
    `;

    // Executar a consulta SQL para obter o ID do projeto do usuário logado
    conexao.query(sqlProjetoId, [userNome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao buscar o ID do projeto do usuário:', error);
            return;
        }

        // Verificar se o projeto foi encontrado
        if (results.length === 0) {
            console.error('Projeto não encontrado para o usuário:', userNome);
            return;
        }

        // ID do projeto do usuário logado
        const projetoId = results[0].id;

        // Definir o status como 'to do'
        const status = 'to do';

        // Montar a consulta SQL para inserir a nova tarefa
        const insertQuery = 'INSERT INTO tarefas (nome, status, projeto_id) VALUES (?, ?, ?)';

        // Executar a consulta SQL para inserir a nova tarefa
        conexao.query(insertQuery, [nomeTarefa, status, projetoId], (error, results, fields) => {
            if (error) {
                console.error('Erro ao inserir a tarefa:', error);
                return;
            }

            console.log('Tarefa inserida com sucesso!');

            res.redirect('/pagina_principal');
        });
    });
}

function mostrarTarefasDoProjeto(req, res) {
    const userNome = req.session.usuario.nome;

    // Consulta SQL para obter o ID do projeto do usuário logado
    const sqlProjetoId = `
        SELECT projetos.id
        FROM projetos
        INNER JOIN usuarios ON projetos.usuario_nome = usuarios.nome
        WHERE usuarios.nome = ?;
    `;

    // Executar a consulta SQL para obter o ID do projeto do usuário logado
    conexao.query(sqlProjetoId, [userNome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao buscar o ID do projeto do usuário:', error);
            res.status(500).send('Erro ao buscar o ID do projeto do usuário');
            return;
        }

        // Verificar se o projeto foi encontrado
        if (results.length === 0) {
            console.error('Projeto não encontrado para o usuário:', userNome);
            res.status(404).send('Projeto não encontrado para o usuário');
            return;
        }

        // ID do projeto do usuário logado
        const projetoId = results[0].id;

        // Consulta SQL para buscar todas as tarefas associadas ao projeto do usuário logado
        const sqlTarefas = `
            SELECT tarefas.id, tarefas.nome, tarefas.status 
            FROM tarefas
            INNER JOIN projetos ON tarefas.projeto_id = projetos.id
            WHERE projetos.id = ?;
        `;

        // Executar a consulta SQL para buscar as tarefas do projeto
        conexao.query(sqlTarefas, [projetoId], (error, results, fields) => {
            if (error) {
                console.error('Erro ao buscar as tarefas do projeto:', error);
                res.status(500).send('Erro ao buscar as tarefas do projeto');
                return;
            }

            // Enviar as tarefas encontradas como resposta
            res.json(results);
        });
    });
}

function concluir_tarefas(req, res) {
    // Obter as tarefas marcadas como concluídas do corpo da requisição
    const tarefasConcluidas = JSON.parse(req.body.tarefasConcluidas);

    console.log(tarefasConcluidas);
    
    // Verificar se existem tarefas a serem concluídas
    if (tarefasConcluidas.length === 0) {
        console.error('Nenhuma tarefa a ser concluída foi fornecida.');
        res.status(400).send('Nenhuma tarefa a ser concluída foi fornecida.');
        return;
    }
    
    // Atualizar o status das tarefas no banco de dados para 'done'
    const sql = 'UPDATE tarefas SET status = "done" WHERE nome IN (?)';

    // Executar a consulta SQL para atualizar o status das tarefas
    conexao.query(sql, [tarefasConcluidas], (error, results, fields) => {
        if (error) {
            console.error('Erro ao atualizar o status das tarefas:', error);
            // Responder à requisição com um status de erro
            res.sendStatus(500); // Ou outro código de status de erro adequado
            return;
        }

        console.log('Status das tarefas atualizado com sucesso!');
        
        // Após a atualização bem-sucedida, redirecione para a página principal
        res.redirect('/pagina_principal'); // Substitua '/pagina_principal' pela rota da sua página principal
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
    obterProjetosUsuario,
    adicionarLista,
    selecionar_projeto,
    adicionarTarefa,
    mostrarTarefasDoProjeto,
    concluir_tarefas
};