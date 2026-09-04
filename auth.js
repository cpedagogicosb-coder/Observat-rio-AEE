// ===== PÁGINA DE LOGIN =====
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Limpa erro anterior
        errorDiv.textContent = '';
        
        // Validação básica
        if (!email || !password) {
            errorDiv.textContent = 'Preencha e-mail e senha.';
            return;
        }
        
        try {
            // Usando o cliente exportado do supabase.js
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Redirecionar para dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Erro no login:', error.message);
            errorDiv.textContent = 'Erro: ' + error.message;
        }
    });
}

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
async function checkAuth() {
    try {
        const user = await getCurrentUser(); // função do supabase.js
        if (!user) {
            window.location.href = 'index.html';
            return null;
        }
        return user;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = 'index.html';
        return null;
    }
}

// ===== LOGOUT =====
document.addEventListener('DOMContentLoaded', function() {
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await supabaseClient.auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            }
        });
    }
});

// ===== CARREGAR INFORMAÇÕES DO USUÁRIO =====
async function loadUserInfo() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const profile = await getUserProfile(user.id);
        if (!profile) return;
        
        const userName = document.querySelector('.user-name');
        const userRole = document.querySelector('.user-role');
        
        if (userName) userName.textContent = profile.nome_completo || 'Usuário';
        if (userRole) userRole.textContent = profile.tipo_usuario || '';
        
        // Mostrar/ocultar menus baseado no tipo
        const tipo = profile.tipo_usuario;
        const isGestor = tipo === 'gestor';
        const isProfessor = tipo === 'professor';
        const isSaude = tipo === 'profissional_saude';
        
        const menuAnamnese = document.getElementById('menuAnamnese');
        const menuPreencher = document.getElementById('menuPreencher');
        
        if (menuAnamnese) menuAnamnese.style.display = isGestor ? 'block' : 'none';
        if (menuPreencher) menuPreencher.style.display = (isProfessor || isSaude) ? 'block' : 'none';
        
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação (se não estiver na página de login)
    if (!document.getElementById('loginForm')) {
        const user = await checkAuth();
        if (!user) return;
        await loadUserInfo();
    }
});