//importar modulo Express
const express = require('express');

//importar modulo express-handlebars
const { engine } = require('express-handlebars');

//importar modulo de rotas
const rotas = require('./rotas/rotas_agenda');

//App
const app = express();

//importar express-session
const session = require('express-session');

//use a session middleware
app.use(session({
  secret: 'sua_chave_secreta',
  resave: false,
  saveUninitialized: true,
}));

//adicionar bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

//adicionar CSS
app.use('/css', express.static('./css'));

//Referenciar a pasta dos scripts
app.use('/javascript', express.static('./javascript'));

//configuração do express-handlebars
app.engine('handlebars', engine({
    helpers:{
        //função auxiliar para verificar igualdade
        condicionalIgualdade: function(parametro1, parametro2, options){
            return parametro1 === parametro2 ? options.fn(this) : options.inverse(this);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

//manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({extended:false}));

//rotas
app.use('/', rotas);


//Servidor
app.listen(8080);