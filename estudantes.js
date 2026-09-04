let estudantes = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) return;
    
    await loadUserInfo();
    await loadEstudantes();
    
    // Configurar busca
    document.getElementById('searchInput').addEventListener('input', filterEstudantes);
    
    // Configurar formulário
    document.getElementById('studentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEstudante();
    });
});

async function loadEstudantes() {
    try {
        const { data, error } = await supabase
            .from('estudantes')
            .select('*')
            .eq('ativo', true)
            .order('nome_completo');
        
        if (error) throw error;
        
        estudantes = data || [];
        renderEstudantes(estudantes);
        
    } catch (error) {
        console.error('Erro ao carregar estudantes:', error);
        document.getElementById('estudantesTableBody').innerHTML = `
            <tr><td colspan="5" style="text-align: center; color: red;">
                Erro ao carregar estudantes
            </td></tr>
        `;
    }
}

function renderEstudantes(lista) {
    const tbody = document.getElementById('estudantesTableBody');
    
    if (!lista || lista.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" style="text-align: center;">
                Nenhum estudante cadastrado
            </td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = lista.map(estudante => `
        <tr>
            <td><strong>${estudante.nome_completo}</strong></td>
            <td>${estudante.matricula || '-'}</td>
            <td>${estudante.escola}</td>
            <td>${estudante.turma || '-'}</td>
            <td>
                <button class="btn-edit" onclick="editEstudante('${estudante.id}')">✏️</button>
                <button class="btn-delete" onclick="deleteEstudante('${estudante.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function filterEstudantes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = estudantes.filter(e => 
        e.nome_completo.toLowerCase().includes(searchTerm) ||
        e.matricula?.toLowerCase().includes(searchTerm) ||
        e.escola.toLowerCase().includes(searchTerm)
    );
    renderEstudantes(filtered);
}

function showModal(estudante = null) {
    const modal = document.getElementById('studentModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('studentForm');
    
    if (estudante) {
        title.textContent = 'Editar Estudante';
        document.getElementById('editId').value = estudante.id;
        document.getElementById('nome').value = estudante.nome_completo;
        document.getElementById('dataNascimento').value = estudante.data_nascimento;
        document.getElementById('matricula').value = estudante.matricula || '';
        document.getElementById('escola').value = estudante.escola;
        document.getElementById('turma').value = estudante.turma || '';
        document.getElementById('turno').value = estudante.turno || '';
        document.getElementById('responsavel').value = estudante.responsavel;
        document.getElementById('telefone').value = estudante.telefone_responsavel || '';
        document.getElementById('diagnostico').value = estudante.diagnostico_principal || '';
    } else {
        title.textContent = 'Novo Estudante';
        document.getElementById('editId').value = '';
        document.getElementById('studentForm').reset();
    }
    
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('studentModal').classList.remove('show');
}

function editEstudante(id) {
    const estudante = estudantes.find(e => e.id === id);
    if (estudante) showModal(estudante);
}

async function deleteEstudante(id) {
    if (!confirm('Tem certeza que deseja excluir este estudante?')) return;
    
    try {
        const { error } = await supabase
            .from('estudantes')
            .update({ ativo: false })
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Estudante excluído com sucesso!');
        await loadEstudantes();
        
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

async function saveEstudante() {
    const id = document.getElementById('editId').value;
    const data = {
        nome_completo: document.getElementById('nome').value,
        data_nascimento: document.getElementById('dataNascimento').value,
        matricula: document.getElementById('matricula').value || null,
        escola: document.getElementById('escola').value,
        turma: document.getElementById('turma').value || null,
        turno: document.getElementById('turno').value || null,
        responsavel: document.getElementById('responsavel').value,
        telefone_responsavel: document.getElementById('telefone').value || null,
        diagnostico_principal: document.getElementById('diagnostico').value || null,
        ativo: true
    };
    
    try {
        let result;
        
        if (id) {
            // Atualizar
            const { data, error } = await supabase
                .from('estudantes')
                .update(data)
                .eq('id', id)
                .select();
            
            if (error) throw error;
            result = data;
        } else {
            // Criar novo
            const { data, error } = await supabase
                .from('estudantes')
                .insert([data])
                .select();
            
            if (error) throw error;
            result = data;
        }
        
        alert(id ? 'Estudante atualizado com sucesso!' : 'Estudante cadastrado com sucesso!');
        closeModal();
        await loadEstudantes();
        
    } catch (error) {
        alert('Erro ao salvar: ' + error.message);
    }
}

// Expor funções para o HTML
window.showModal = showModal;
window.closeModal = closeModal;
window.editEstudante = editEstudante;
window.deleteEstudante = deleteEstudante;