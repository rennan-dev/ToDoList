// Importar o módulo express
const express = require('express');

// Extraindo a função Router do módulo express
const router = express.Router();

// Importar módulo de serviços
const servico = require('../servicos/agenda_servico');

// *** ADICIONE SUAS ROTAS AQUI

//rota principal
router.get('/', function(req, res){
    servico.pagina_inicial(req,res);
});

router.get('/login', function(req, res){
    servico.pagina_login(req,res);
});

router.get('/cadastro', function(req, res){
    servico.pagina_cadastro(req,res);
});

router.post('/login_usuario', function(req, res){
    servico.login_usuario(req,res);
});

router.post('/cadastrar_usuario', function(req,res) {
    servico.cadastrar_novo_usuario(req,res);
});

router.get('/pagina_principal', function(req,res) {
    servico.pagina_principal(req,res);
});

router.get('/logout', function(req,res) {
    servico.logout(req,res);
});

router.post('/adicionar_projeto', function(req,res) {
    servico.adicionar_projeto(req,res);
});

router.get('/listar_projetos', function(req,res) {
    servico.listarProjetos(req,res);
});

router.post('/atualizar_projeto_selecionado', function(req,res) {
    servico.atualizarProjetoSelecionado(req,res);
});

// Exportar o router
module.exports = router;