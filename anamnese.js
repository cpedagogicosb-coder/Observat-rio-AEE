let categorias = [];
let perguntas = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;
    
    await loadUserInfo();
    
    // Verificar se é gestor
    const profile = await getUserProfile(user.id);
    if (profile.tipo_usuario !== 'gestor') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    await loadCategorias();
    await loadPerguntas();
    
    // Mostrar opções para múltipla escolha
    document.getElementById('tipoResposta').addEventListener('change', function() {
        const show = this.value === 'multipla_escolha';
        document.getElementById('opcoesGroup').style.display = show ? 'block' : 'none';
    });
    
    // Configurar formulário
    document.getElementById('perguntaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePergunta();
    });
});

async function loadCategorias() {
    try {
        categorias = await getCategoriasAnamnese();
        
        const select = document.getElementById('categoriaId');
        select.innerHTML = '<option value="">Selecione uma categoria</option>';
        
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nome;
            select.appendChild(option);
        });
        
        // Mostrar categorias
        const container = document.getElementById('categoriasList');
        container.innerHTML = categorias.map(c => `
            <span style="display: inline-block; background: #e3f2fd; padding: 5px 12px; 
                         border-radius: 20px; margin: 5px; font-size: 14px;">
                ${c.nome}
            </span>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

async function loadPerguntas() {
    try {
        const { data, error } = await supabase
            .from('perguntas_anamnese')
            .select(`
                *,
                categoria_id (nome)
            `)
            .eq('ativo', true)
            .order('ordem');
        
        if (error) throw error;
        
        perguntas = data || [];
        renderPerguntas();
        
    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        document.getElementById('perguntasTableBody').innerHTML = `
            <tr><td colspan="6" style="text-align: center; color: red;">
                Erro ao carregar perguntas
            </td></tr>
        `;
    }
}

function renderPerguntas() {
    const tbody = document.getElementById('perguntasTableBody');
    
    if (!perguntas || perguntas.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align: center;">
                Nenhuma pergunta cadastrada
            </td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = perguntas.map(p => `
        <tr>
            <td>${p.ordem || 0}</td>
            <td>${p.pergunta}</td>
            <td>${p.categoria_id?.nome || '-'}</td>
            <td>${formatTipo(p.tipo_resposta)}</td>
            <td>${p.obrigatorio ? '✅' : '❌'}</td>
            <td>
                <button class="btn-edit" onclick="editPergunta('${p.id}')">✏️</button>
                <button class="btn-delete" onclick="deletePergunta('${p.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function formatTipo(tipo) {
    const map = {
        'texto_curto': 'Texto Curto',
        'texto_longo': 'Texto Longo',
        'multipla_escolha': 'Múltipla Escolha',
        'sim_nao': 'Sim/Não',
        'numero': 'Número',
        'data': 'Data'
    };
    return map[tipo] || tipo;
}

function showPerguntaModal(pergunta = null) {
    const modal = document.getElementById('perguntaModal');
    const title = document.getElementById('modalPerguntaTitle');
    
    if (pergunta) {
        title.textContent = 'Editar Pergunta';
        document.getElementById('editPerguntaId').value = pergunta.id;
        document.getElementById('categoriaId').value = pergunta.categoria_id;
        document.getElementById('perguntaTexto').value = pergunta.pergunta;
        document.getElementById('tipoResposta').value = pergunta.tipo_resposta;
        document.getElementById('obrigatorio').checked = pergunta.obrigatorio;
        
        if (pergunta.opcoes_resposta) {
            document.getElementById('opcoesResposta').value = pergunta.opcoes_resposta.join('\n');
            document.getElementById('opcoesGroup').style.display = 'block';
        }
    } else {
        title.textContent = 'Nova Pergunta';
        document.getElementById('editPerguntaId').value = '';
        document.getElementById('perguntaForm').reset();
        document.getElementById('opcoesGroup').style.display = 'none';
    }
    
    modal.classList.add('show');
}

function closePerguntaModal() {
    document.getElementById('perguntaModal').classList.remove('show');
}

function editPergunta(id) {
    const pergunta = perguntas.find(p => p.id === id);
    if (pergunta) showPerguntaModal(pergunta);
}

async function deletePergunta(id) {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;
    
    try {
        const { error } = await supabase
            .from('perguntas_anamnese')
            .update({ ativo: false })
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Pergunta excluída com sucesso!');
        await loadPerguntas();
        
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

async function savePergunta() {
    const id = document.getElementById('editPerguntaId').value;
    const data = {
        categoria_id: document.getElementById('categoriaId').value,
        pergunta: document.getElementById('perguntaTexto').value,
        tipo_resposta: document.getElementById('tipoResposta').value,
        obrigatorio: document.getElementById('obrigatorio').checked,
        ordem: perguntas.length + 1,
        ativo: true
    };
    
    // Opções para múltipla escolha
    if (data.tipo_resposta === 'multipla_escolha') {
        const opcoes = document.getElementById('opcoesResposta').value
            .split('\n')
            .filter(o => o.trim());
        data.opcoes_resposta = opcoes;
    }
    
    try {
        let result;
        
        if (id) {
            // Atualizar
            const { data: updated, error } = await supabase
                .from('perguntas_anamnese')
                .update(data)
                .eq('id', id)
                .select();
            
            if (error) throw error;
            result = updated;
        } else {
            // Criar nova
            const { data: created, error } = await supabase
                .from('perguntas_anamnese')
                .insert([data])
                .select();
            
            if (error) throw error;
            result = created;
        }
        
        alert(id ? 'Pergunta atualizada com sucesso!' : 'Pergunta criada com sucesso!');
        closePerguntaModal();
        await loadPerguntas();
        
    } catch (error) {
        alert('Erro ao salvar: ' + error.message);
    }
}

// Expor funções para o HTML
window.showPerguntaModal = showPerguntaModal;
window.closePerguntaModal = closePerguntaModal;
window.editPergunta = editPergunta;
window.deletePergunta = deletePergunta;