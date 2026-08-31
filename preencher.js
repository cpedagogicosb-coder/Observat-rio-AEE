let estudantes = [];
let perguntas = [];
let respostas = {};

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;
    
    await loadUserInfo();
    await loadEstudantes();
    await loadPerguntas();
    
    // Configurar seleção de estudante
    document.getElementById('selectEstudante').addEventListener('change', async function() {
        if (this.value) {
            await carregarRespostas(this.value);
            document.getElementById('anamneseForm').style.display = 'block';
        } else {
            document.getElementById('anamneseForm').style.display = 'none';
        }
    });
});

async function loadEstudantes() {
    try {
        const { data, error } = await supabase
            .from('estudantes')
            .select('id, nome_completo, matricula')
            .eq('ativo', true)
            .order('nome_completo');
        
        if (error) throw error;
        
        estudantes = data || [];
        const select = document.getElementById('selectEstudante');
        
        select.innerHTML = '<option value="">Selecione um estudante</option>';
        estudantes.forEach(e => {
            const option = document.createElement('option');
            option.value = e.id;
            option.textContent = `${e.nome_completo} (${e.matricula || 'Sem matrícula'})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar estudantes:', error);
        alert('Erro ao carregar estudantes');
    }
}

async function loadPerguntas() {
    try {
        const { data, error } = await supabase
            .from('perguntas_anamnese')
            .select('*')
            .eq('ativo', true)
            .order('ordem');
        
        if (error) throw error;
        perguntas = data || [];
        
    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
    }
}

async function carregarRespostas(estudanteId) {
    try {
        const { data, error } = await supabase
            .from('respostas_anamnese')
            .select('*')
            .eq('estudante_id', estudanteId);
        
        if (error) throw error;
        
        // Montar objeto de respostas
        respostas = {};
        data.forEach(r => {
            respostas[r.pergunta_id] = r.resposta;
        });
        
        renderPerguntas();
        
    } catch (error) {
        console.error('Erro ao carregar respostas:', error);
    }
}

function renderPerguntas() {
    const container = document.getElementById('perguntasContainer');
    
    if (!perguntas || perguntas.length === 0) {
        container.innerHTML = '<p>Nenhuma pergunta cadastrada.</p>';
        return;
    }
    
    container.innerHTML = perguntas.map(p => {
        const valor = respostas[p.id] || '';
        return `
            <div class="form-group">
                <label>
                    ${p.pergunta}
                    ${p.obrigatorio ? '<span style="color: red;">*</span>' : ''}
                </label>
                ${renderInput(p, valor)}
            </div>
        `;
    }).join('');
}

function renderInput(pergunta, valor) {
    switch(pergunta.tipo_resposta) {
        case 'texto_curto':
            return `<input type="text" id="resp_${pergunta.id}" value="${valor || ''}" 
                           ${pergunta.obrigatorio ? 'required' : ''}>`;
        
        case 'texto_longo':
            return `<textarea id="resp_${pergunta.id}" rows="3" 
                              ${pergunta.obrigatorio ? 'required' : ''}>${valor || ''}</textarea>`;
        
        case 'multipla_escolha':
            if (!pergunta.opcoes_resposta) return '';
            return `
                <select id="resp_${pergunta.id}" ${pergunta.obrigatorio ? 'required' : ''}>
                    <option value="">Selecione...</option>
                    ${pergunta.opcoes_resposta.map(op => `
                        <option value="${op}" ${valor === op ? 'selected' : ''}>${op}</option>
                    `).join('')}
                </select>
            `;
        
        case 'sim_nao':
            return `
                <select id="resp_${pergunta.id}" ${pergunta.obrigatorio ? 'required' : ''}>
                    <option value="">Selecione...</option>
                    <option value="Sim" ${valor === 'Sim' ? 'selected' : ''}>Sim</option>
                    <option value="Não" ${valor === 'Não' ? 'selected' : ''}>Não</option>
                </select>
            `;
        
        case 'numero':
            return `<input type="number" id="resp_${pergunta.id}" value="${valor || ''}" 
                           ${pergunta.obrigatorio ? 'required' : ''}>`;
        
        case 'data':
            return `<input type="date" id="resp_${pergunta.id}" value="${valor || ''}" 
                           ${pergunta.obrigatorio ? 'required' : ''}>`;
        
        default:
            return `<input type="text" id="resp_${pergunta.id}" value="${valor || ''}" 
                           ${pergunta.obrigatorio ? 'required' : ''}>`;
    }
}

async function salvarAnamnese() {
    const estudanteId = document.getElementById('selectEstudante').value;
    if (!estudanteId) {
        alert('Selecione um estudante primeiro!');
        return;
    }
    
    const user = await getCurrentUser();
    if (!user) return;
    
    try {
        // Coletar todas as respostas
        const respostasParaSalvar = [];
        
        for (const p of perguntas) {
            const input = document.getElementById(`resp_${p.id}`);
            if (input) {
                const valor = input.value.trim();
                if (p.obrigatorio && !valor) {
                    alert(`A pergunta "${p.pergunta}" é obrigatória!`);
                    input.focus();
                    return;
                }
                
                if (valor) {
                    respostasParaSalvar.push({
                        estudante_id: estudanteId,
                        pergunta_id: p.id,
                        resposta: valor,
                        respondido_por: user.id
                    });
                }
            }
        }
        
        if (respostasParaSalvar.length === 0) {
            alert('Nenhuma resposta para salvar!');
            return;
        }
        
        // Salvar no Supabase
        for (const r of respostasParaSalvar) {
            const { error } = await supabase
                .from('respostas_anamnese')
                .upsert([r], {
                    onConflict: 'estudante_id, pergunta_id'
                });
            
            if (error) throw error;
        }
        
        alert('Anamnese salva com sucesso!');
        await carregarRespostas(estudanteId);
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}

function clearForm() {
    const inputs = document.querySelectorAll('#perguntasContainer input, #perguntasContainer select, #perguntasContainer textarea');
    inputs.forEach(i => i.value = '');
}