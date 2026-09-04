document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const user = await checkAuth();
    if (!user) return;
    
    // Carregar dados do dashboard
    await loadDashboardStats();
    await loadRecentStudents();
    
    // Data atual
    const now = new Date();
    document.getElementById('currentDate').textContent = 
        now.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
});

async function loadDashboardStats() {
    try {
        // Total de estudantes
        const { count: totalEstudantes } = await supabase
            .from('estudantes')
            .select('*', { count: 'exact', head: true })
            .eq('ativo', true);
        
        // Total de planos ativos
        const { count: totalPlanos } = await supabase
            .from('planos_atendimento')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ativo');
        
        // Atendimentos do mês
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        
        const { count: totalAtendimentos } = await supabase
            .from('registros_atendimento')
            .select('*', { count: 'exact', head: true })
            .gte('data_atendimento', inicioMes.toISOString());
        
        // Atualizar a UI
        document.getElementById('totalEstudantes').textContent = totalEstudantes || 0;
        document.getElementById('totalPlanos').textContent = totalPlanos || 0;
        document.getElementById('totalAtendimentos').textContent = totalAtendimentos || 0;
        document.getElementById('totalAvaliacoes').textContent = 0;
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

async function loadRecentStudents() {
    try {
        const { data, error } = await supabase
            .from('estudantes')
            .select('id, nome_completo, escola, turma, created_at')
            .eq('ativo', true)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const container = document.getElementById('recentStudentsList');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p>Nenhum estudante cadastrado</p>';
            return;
        }
        
        container.innerHTML = data.map(student => `
            <div class="student-item">
                <div>
                    <div class="student-name">${student.nome_completo}</div>
                    <div class="student-school">${student.escola} - ${student.turma || 'Sem turma'}</div>
                </div>
                <div class="student-date">
                    ${new Date(student.created_at).toLocaleDateString('pt-BR')}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar estudantes recentes:', error);
        document.getElementById('recentStudentsList').innerHTML = '<p>Erro ao carregar estudantes</p>';
    }
}