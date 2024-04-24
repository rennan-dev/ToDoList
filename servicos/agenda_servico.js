//********************************************
//Todas as importações das funções
//estão no final do código
//vá para o final para ver todas
// as funções desenvolvidas nesse projeto
//********************************************



// Importar o módulo de conexão com banco MySQL
const conexao = require('../banco_de_dados/conexao');

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

    //verificar se há espaços em branco no nome, email e senhas
    if (nome.trim() === '' || email.trim() === '' || senha.trim() === '' || confirmarSenha.trim() === '') {
        return res.render('cadastro', { erro: 'Por favor, preencha todos os campos.' });
    }

    //verificar se há espaços em branco no username
    if (nome.includes(' ')) {
        return res.render('cadastro', { erro: 'O username não pode conter espaços em branco.' });
    }

    //verificar se há espaços em branco no email
    if (email.includes(' ')) {
        return res.render('cadastro', { erro: 'O email não pode conter espaços em branco.' });
    }

    //verificar se há espaços em branco nas senhas
    if (senha.includes(' ') || confirmarSenha.includes(' ')) {
        return res.render('cadastro', { erro: 'A senha não pode conter espaços em branco.' });
    }

    if (!nome || !email || !senha || !confirmarSenha) {
        console.log('Erro primordial');
        return res.render('cadastro', { erro: 'Por favor, preencha todos os campos.' });
    }

    if (senha != confirmarSenha) {
        console.log('Erro de senha');
        return res.render('cadastro', { erro: 'Senha e Confirmar senha precisam estar iguais.' });
    }

    //consulta SQL para verificar se o nome de usuário ou o email já existem no banco de dados
    const sqlVerificarExistencia = "SELECT * FROM usuarios WHERE nome = ? OR email = ?";
    const valuesExistencia = [nome, email];

    conexao.query(sqlVerificarExistencia, valuesExistencia, function(err, result) {
        if (err) {
            console.log('Erro ao verificar existência de usuário:', err.message);
            return res.render('cadastro', { erro: 'Erro ao criar conta.' });
        }

        //se já existe um usuário com o mesmo nome ou email, retornar mensagem de erro
        if (result.length > 0) {
            console.log('Nome de usuário ou email já existem no banco de dados');
            return res.render('cadastro', { erro: 'Nome de usuário ou email já cadastrados.' });
        }

        //se não existir usuário com o mesmo nome ou email, proceder com a inserção
        const sqlInsertUsuario = "INSERT INTO usuarios (nome, email, senha, projeto_selecionado) VALUES (?, ?, ?, ?)";
        const valuesUsuario = [nome, email, senha, 'Hoje'];

        conexao.query(sqlInsertUsuario, valuesUsuario, function(err, result) {
            if (err) {
                console.log('Erro ao inserir novo usuário:', err.message);
                return res.render('cadastro', { erro: 'Erro ao criar conta.' });
            }

            //criação do projeto 'Hoje' para o novo usuário
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
    });
}

function pagina_principal(req, res){
    //verificar se o usuário está autenticado
    if (req.session && req.session.usuario) {
        const emailUsuario = req.session.usuario.email;

        //consulta MySQL para obter o projeto selecionado do usuário
        const sql = 'SELECT projeto_selecionado FROM usuarios WHERE email = ?';
        const values = [emailUsuario];

        conexao.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao executar consulta:', err);
                res.status(500).send('Erro ao obter o projeto selecionado do usuário');
                return;
            }

            if (results.length > 0) {
                //projeto selecionado encontrado
                const projetoSelecionado = results[0].projeto_selecionado;
                res.render('pagina_principal', { usuario: req.session.usuario, projetoSelecionado: projetoSelecionado });
            } else {
                res.status(404).send('Projeto selecionado não encontrado para o usuário');
            }
        });
    } else {
        //usuário não autenticado, redireciona para a página de login
        res.redirect('/login');
    }
}

function logout(req, res) {
    //destrua a sessão
    req.session.destroy(function(err) {
        if (err) {
            console.error('Erro ao encerrar a sessão:', err);
            res.status(500).send('Erro ao encerrar a sessão');
        } else {
            res.redirect('/login'); 
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
            //armazene o nome do usuário na sessão
            const nome = results[0].nome;
            //atualizar o projeto selecionado no banco de dados
            const sqlUpdateProjetoSelecionado = 'UPDATE usuarios SET projeto_selecionado = ? WHERE email = ?';
            const valuesUpdateProjetoSelecionado = ['Hoje', email];
            conexao.query(sqlUpdateProjetoSelecionado, valuesUpdateProjetoSelecionado, (err, results) => {
                if (err) {
                    console.error('Erro ao atualizar projeto selecionado:', err);
                    res.status(500).send('Erro ao atualizar projeto selecionado');
                    return;
                }
                console.log('Projeto selecionado atualizado com sucesso');
                //armazenar informações do usuário na sessão
                req.session.usuario = {
                    email: email,
                    nome: nome
                };
                //redirecionar para a página principal
                res.redirect('/pagina_principal');
            });
        } else {
            res.render('login', { erro: 'Credenciais inválidas. Por favor, tente novamente.' });
        }
    });
}

function obterProjetosUsuario(req, res) {
    //verificar se o usuário está autenticado
    if (req.session && req.session.usuario) {
        const usuarioNome = req.session.usuario.nome;

        //consulta MySQL para obter os projetos do usuário
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
        //usuário não autenticado, responder com erro
        res.status(401).json({ erro: 'Usuário não autenticado' });
    }
}

//função para adicionar uma nova lista de projetos
function adicionarLista(req, res) {
    const nomeLista = req.body.nome; 
    const usuarioNome = req.session.usuario.nome; 

    //verificar se há espaços em branco
    if(nomeLista.trim() === '') {
        return res.status(400).send('<script>alert("A lista não pode ser enviada vazia"); window.location.href = "/pagina_principal";</script>');
    }


    //verificar se o nome da lista não está vazio
    if(!nomeLista) {
        return res.status(400).send('<script>alert("A lista não pode ser enviada vazia"); window.location.href = "/pagina_principal";</script>');
    }

    //consulta SQL para verificar se o usuário já possui um projeto com o mesmo nome
    const sqlVerificarProjeto = 'SELECT * FROM projetos WHERE nome = ? AND usuario_nome = ?';
    const valuesVerificarProjeto = [nomeLista, usuarioNome];

    conexao.query(sqlVerificarProjeto, valuesVerificarProjeto, (err, results) => {
        if (err) {
            console.error('Erro ao verificar projeto:', err);
            return res.status(500).send('<script>alert("Erro ao verificar projeto"); window.location.href = "/pagina_principal";</script>');
        }

        //se já existir um projeto com o mesmo nome para o usuário, enviar mensagem de erro
        if (results.length > 0) {
            return res.status(400).send('<script>alert("Já existe uma lista com esse nome"); window.location.href = "/pagina_principal";</script>');
        }

        //inserir os dados da nova lista na tabela de projetos
        const sql = 'INSERT INTO projetos (nome, usuario_nome) VALUES (?, ?)';
        const values = [nomeLista, usuarioNome];

        conexao.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao adicionar lista de projetos:', err);
                return res.status(500).send('<script>alert("Erro ao adicionar lista de projetos"); window.location.href = "/pagina_principal";</script>');
            }

            //redirecionar o usuário de volta para a página principal após a inserção bem-sucedida
            return res.redirect('/pagina_principal');
        });
    });
}


//rota para selecionar um projeto
function selecionar_projeto(req, res) {
    const projetoSelecionado = req.body.projetoSelecionado;
    
    //atualizar o campo 'projeto_selecionado' no banco de dados para o projeto selecionado
    const sql = 'UPDATE usuarios SET projeto_selecionado = ? WHERE nome = ?';
    const values = [projetoSelecionado, req.session.usuario.nome];

    conexao.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erro ao selecionar projeto:', err);
            res.status(500).json({ erro: 'Erro ao selecionar projeto' });
            return;
        }
        res.status(200).send('Projeto selecionado com sucesso');
    });
}

//função para inserir uma nova tarefa no banco de dados
function adicionarTarefa(req, res) {
    const nomeTarefa = req.body.nomeDaTarefa;
    const userNome = req.session.usuario.nome;

    //verificar se há espaços em branco
    if(nomeTarefa.trim() === '') {
        return res.status(400).send('<script>alert("O nome da tarefa não pode ser nulo."); window.location.href = "/pagina_principal";</script>');
    }

    if (!nomeTarefa) {
        return res.status(400).send('<script>alert("O nome da tarefa não pode ser nulo."); window.location.href = "/pagina_principal";</script>');
    }

    //consulta SQL para obter o nome do projeto selecionado pelo usuário
    const sqlProjetoSelecionado = 'SELECT projeto_selecionado FROM usuarios WHERE nome = ?';

    //executar a consulta SQL para obter o nome do projeto selecionado pelo usuário
    conexao.query(sqlProjetoSelecionado, [userNome], (error, results, fields) => {
        if (error) {
            //mensagem de erro ao buscar o projeto selecionado do usuário
            return res.status(500).send(`<script>alert("Erro ao buscar o projeto selecionado do usuário: ${error.message}"); window.location.href = "/pagina_principal";</script>`);
        }

        //verificar se o projeto foi encontrado
        if (results.length === 0 || !results[0].projeto_selecionado) {
            //mensagem de erro se o projeto selecionado não foi encontrado
            return res.status(404).send('<script>alert("Projeto selecionado não encontrado para o usuário."); window.location.href = "/pagina_principal";</script>');
        }

        //nome do projeto selecionado
        const projetoSelecionado = results[0].projeto_selecionado;

        //consulta SQL para obter o ID do projeto selecionado pelo usuário
        const sqlProjetoId = 'SELECT id FROM projetos WHERE nome = ? AND usuario_nome = ?';

        //executar a consulta SQL para obter o ID do projeto selecionado pelo usuário
        conexao.query(sqlProjetoId, [projetoSelecionado, userNome], (error, results, fields) => {
            if (error) {
                //mensagem de erro ao buscar o ID do projeto selecionado
                return res.status(500).send(`<script>alert("Erro ao buscar o ID do projeto selecionado: ${error.message}"); window.location.href = "/pagina_principal";</script>`);
            }

            //verificar se o projeto foi encontrado
            if (results.length === 0) {
                //mensagem de erro se o projeto não foi encontrado
                return res.status(404).send('<script>alert("Projeto não encontrado."); window.location.href = "/pagina_principal";</script>');
            }

            //ID do projeto selecionado
            const projetoId = results[0].id;

            //definir o status como 'to do'
            const status = 'to do';

            //montar a consulta SQL para inserir a nova tarefa
            const insertQuery = 'INSERT INTO tarefas (nome, status, projeto_id) VALUES (?, ?, ?)';

            //executar a consulta SQL para inserir a nova tarefa
            conexao.query(insertQuery, [nomeTarefa, status, projetoId], (error, results, fields) => {
                if (error) {
                    //mensagem de erro ao inserir a tarefa
                    return res.status(500).send(`<script>alert("Erro ao inserir a tarefa: ${error.message}"); window.location.href = "/pagina_principal";</script>`);
                }

                //mensagem de sucesso ao inserir a tarefa
                return res.status(200).send('<script>alert("Tarefa inserida com sucesso!"); window.location.href = "/pagina_principal";</script>');
            });
        });
    });
}


function mostrarTarefasDoProjeto(req, res) {
    const userNome = req.session.usuario.nome;

    //consulta SQL para obter o ID do projeto do usuário logado
    const sqlProjetoSelecionado = `
    SELECT projeto_selecionado
    FROM usuarios
    WHERE nome = ?;
`;

    //executar a consulta SQL para obter o projeto selecionado pelo usuário
    conexao.query(sqlProjetoSelecionado, [userNome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao buscar o projeto selecionado do usuário:', error);
            res.status(500).send('Erro ao buscar o projeto selecionado do usuário');
            return;
        }

        //verificar se o projeto foi encontrado
        if (results.length === 0 || !results[0].projeto_selecionado) {
            console.error('Projeto selecionado não encontrado para o usuário:', userNome);
            res.status(404).send('Projeto selecionado não encontrado para o usuário');
            return;
        }

        //nome do projeto selecionado
        const projetoSelecionado = results[0].projeto_selecionado;

        //consulta SQL para buscar todas as tarefas associadas ao projeto selecionado pelo usuário
        const sqlTarefas = `
            SELECT tarefas.id, tarefas.nome, tarefas.status 
            FROM tarefas
            INNER JOIN projetos ON tarefas.projeto_id = projetos.id
            INNER JOIN usuarios ON projetos.usuario_nome = usuarios.nome
            WHERE projetos.nome = ? AND usuarios.nome = ?
        `;

        //executar a consulta SQL para buscar as tarefas do projeto selecionado pelo usuário
        conexao.query(sqlTarefas, [projetoSelecionado, userNome], (error, results, fields) => {
            if (error) {
                console.error('Erro ao buscar as tarefas do projeto selecionado:', error);
                res.status(500).send('Erro ao buscar as tarefas do projeto selecionado');
                return;
            }

            //enviar as tarefas encontradas como resposta
            res.json(results);
        });
    });
}

function concluir_tarefas(req, res) {
    //obter as tarefas marcadas como concluídas do corpo da requisição
    const tarefasConcluidas = JSON.parse(req.body.tarefasConcluidas);

    console.log(tarefasConcluidas);
    
    //verificar se existem tarefas a serem concluídas
    if (tarefasConcluidas.length === 0) {
        console.error('Nenhuma tarefa a ser concluída foi fornecida.');
        res.status(400).send('Nenhuma tarefa a ser concluída foi fornecida.');
        return;
    }
    
    //atualizar o status das tarefas no banco de dados para 'done'
    const sql = 'UPDATE tarefas SET status = "done" WHERE nome IN (?)';

    //executar a consulta SQL para atualizar o status das tarefas
    conexao.query(sql, [tarefasConcluidas], (error, results, fields) => {
        if (error) {
            console.error('Erro ao atualizar o status das tarefas:', error);
            res.sendStatus(500); 
            return;
        }

        console.log('Status das tarefas atualizado com sucesso!');
        
        //após a atualização bem-sucedida, redirecione para a página principal
        res.redirect('/pagina_principal'); 
    });
}

//função para apagar uma tarefa do banco de dados
function apagarTarefa(req, res) {
    const nomeTarefa = req.body.nomeTarefa;
    const userNome = req.session.usuario.nome; 

    //consulta SQL para apagar a tarefa com base no nome e no ID do usuário
    const sql = `
        DELETE FROM tarefas
        WHERE nome = ? AND projeto_id IN (
            SELECT id
            FROM projetos
            WHERE usuario_nome = ?
        )
    `;

    //executar a consulta SQL para apagar a tarefa
    conexao.query(sql, [nomeTarefa, userNome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao apagar a tarefa:', error);
            res.status(500).send('Erro ao apagar a tarefa');
            return;
        }

        console.log('Tarefa apagada com sucesso!');
        res.sendStatus(200);
    });
}


//exportar funções
module.exports = {
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
    concluir_tarefas,
    apagarTarefa
};