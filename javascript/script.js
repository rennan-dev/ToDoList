document.addEventListener('DOMContentLoaded', function() {
    var modal = document.getElementById("modal");
    var addButton = document.getElementById("addButton");
    var cancelButton = document.getElementById("cancelButton");

    addButton.onclick = function() {
        modal.style.display = "block";
    }

    cancelButton.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});

$(document).ready(function() {

    $(document).on('change', 'input[type="checkbox"]', function() {
        //verificar se pelo menos uma checkbox está marcada
        if ($('input[type="checkbox"]:checked').length > 0) {
            //se sim, habilitar o botão 'Tarefa Concluída'
            $('#concluirTarefaButton').prop('disabled', false);
        } else {
            //se não, desabilitar o botão 'Tarefa Concluída'
            $('#concluirTarefaButton').prop('disabled', true);
        }
    });

    $.ajax({
        url: '/projetos',
        method: 'GET',
        success: function(response) {
            //atualizar a lista de projetos na página
            var projetosHtml = '';
            response.forEach(function(projeto) {
                projetosHtml += '<li style="cursor: pointer;" class="projeto" data-nome="' + projeto + '">' + projeto + '</li>';
            });
            $('#lista-projetos').html(projetosHtml);

            //adicionar evento de clique aos itens da lista de projetos
            $('.projeto').click(function() {
                var projetoSelecionado = $(this).data('nome');
                //enviar requisição para a rota do servidor para atualizar o projeto selecionado
                $.ajax({
                    url: '/selecionar_projeto',
                    method: 'POST',
                    data: { projetoSelecionado: projetoSelecionado },
                    success: function(response) {
                        location.reload();
                    },
                    error: function(xhr, status, error) {
                        console.error('Erro ao selecionar projeto:', error);
                    }
                });
            });
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar projetos:', error);
        }
    });

    //fazer requisição AJAX para buscar e mostrar as tarefas do projeto selecionado
    $.ajax({
        url: '/mostrar_tarefas',
        method: 'GET',
        success: function(response) {
            //limpar a área de lista de tarefas
            $('#toDoTasks').empty();
            $('#doneTasks').empty();

            //iterar sobre as tarefas retornadas e renderizá-las como checkboxes
            response.forEach(function(tarefa) {
                console.log(tarefa.status);
                //verificar o status da tarefa e renderizá-la na seção correspondente
                if (tarefa.status === 'to do') {
                    $('#toDoTasks').append('<div><input type="checkbox" id="tarefa_' + tarefa.id + '" name="tarefa_' + tarefa.id + '" value="' + tarefa.nome + '"><label for="tarefa_' + tarefa.id + '">' + tarefa.nome + '</label></div>');
                } else if (tarefa.status === 'done') {
                    $('#doneTasks').append('<div><label>' + tarefa.nome + '</label></div>');

                }
            });
        },
        error: function(xhr, status, error) {
            console.error('Erro ao buscar tarefas do projeto:', error);
        }
    });


    $('#concluirTarefaButton').click(function() {
    //obter todas as caixas de seleção marcadas
    //obter todas as caixas de seleção marcadas dentro das listas de tarefas To Do e Done
    var tarefasConcluidas = $('#toDoTasks input[type="checkbox"]:checked, #doneTasks input[type="checkbox"]:checked').map(function() {
    return $(this).val();
    }).get();


    //enviar uma solicitação AJAX para a rota '/concluir_tarefas' com as tarefas marcadas como concluídas
    $.ajax({
        url: '/concluir_tarefas',
        method: 'POST',
        data: { tarefasConcluidas: JSON.stringify(tarefasConcluidas) }, //alterado para enviar diretamente os IDs das tarefas
        success: function(response) {
            window.location.reload();
        },
        error: function(xhr, status, error) {
            //tratar erros de requisição, se necessário
            console.error('Erro ao concluir tarefas:', error);
        }
    });
    });


    //adicionar evento de clique ao botão "Apagar uma Tarefa"
    $('#apagarTarefaButton').click(function() {
        //limpar a lista de tarefas do modal
        $('#listaTarefasApagar').empty();

        //adicionar as tarefas 'to do' ao modal
        $('#toDoTasks input[type="checkbox"]').each(function() {
            var nomeTarefa = $(this).val();
            $('#listaTarefasApagar').append('<li style="cursor: pointer;" class="apagar-li">' + nomeTarefa + '</li>');
        });

        //adicionar as tarefas 'done' ao modal
        $('#doneTasks label').each(function() {
            var nomeTarefa = $(this).text();
            $('#listaTarefasApagar').append('<li style="cursor: pointer;" class="apagar-li">' + nomeTarefa + '</li>');
        });

        //exibir o modal
        $('#modalApagarTarefa').css('display', 'block');
    });


    //adicionar evento de clique ao botão de fechar do modal
    $('.close').click(function() {
        $('#modalApagarTarefa').css('display', 'none');
    });

    //adicionar evento de clique aos elementos da lista de tarefas
    $('#listaTarefasApagar').on('click', 'li', function() {
        //obter o nome da tarefa selecionada
        var nomeTarefa = $(this).text();

        //enviar uma solicitação AJAX para apagar a tarefa
        $.ajax({
            url: '/apagar_tarefa',
            method: 'POST',
            data: { nomeTarefa: nomeTarefa },
            success: function(response) {
                //se a tarefa foi apagada com sucesso, recarregue a página ou atualize a lista de tarefas
                location.reload(); // Você pode ajustar isso conforme necessário
            },
            error: function(xhr, status, error) {
                //tratar erros de requisição, se necessário
                console.error('Erro ao apagar a tarefa:', error);
            }
        });
    });
});
