# Check List +

## Projeto para Bemol Digital

## Este é um projeto desenvolvido por Rennan de Souza Alves

## Instalação

### Requisitos

Antes de começar, certifique-se de que você tem as seguintes ferramentas instaladas:

- **Node.js** (versão recomendada: 14.x ou superior)
- **MySQL** (ou MariaDB) instalado e em funcionamento

### Passos para Instalação

1. **Clone o repositório** para sua máquina local:
    ```
    https://github.com/rennan-dev/ToDoList.git
    ```

2. **Instale as dependências do projeto**:
    Navegue até a pasta do projeto e execute o comando:
    ```
    npm install
    ```

3. **Configure o banco de dados**:
    - Vá para a pasta `banco_de_dados` e crie o banco de dados usando o arquivo `agenda.sql`.
    - Certifique-se de modificar o user e a senha para o seu MySQL no arquivo `conexao.js`.

4. **Configure o MySQL**:
    - Se ainda não tem o MySQL instalado, [siga as instruções de instalação do MySQL](https://dev.mysql.com/doc/refman/8.0/en/installing.html) ou [instale o MariaDB](https://mariadb.org/download/).
    - Após a instalação, copie o código do arquivo `agenda.sql` cole e execute no mysql workbench ou no editor de sua preferência.

## Rodar projeto

Vá para onde está main.js e execute o seguinte comando:

``node main.js``

Para visualizar, vá no seu navegador e acesse pelo seguinte link:

``http://localhost:8080/login``