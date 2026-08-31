// Página de Login
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Redirecionar para dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorDiv.textContent = 'Erro: ' + error.message;
        }
    });
}

// Verificar autenticação em páginas protegidas
async function checkAuth() {
    const user = await getCurrentUser();
    
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    
    return user;
}

// Logout
document.getElementById('btnLogout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// Carregar informações do usuário
async function loadUserInfo() {
    try {
        const user = await getCurrentUser();
        if (user) {
            const profile = await getUserProfile(user.id);
            const userName = document.querySelector('.user-name');
            const userRole = document.querySelector('.user-role');
            
            if (userName) userName.textContent = profile.nome_completo;
            if (userRole) userRole.textContent = profile.tipo_usuario;
            
            // Mostrar/ocultar menus baseado no tipo
            const isGestor = profile.tipo_usuario === 'gestor';
            const isProfessor = profile.tipo_usuario === 'professor';
            const isSaude = profile.tipo_usuario === 'profissional_saude';
            
            const menuAnamnese = document.getElementById('menuAnamnese');
            const menuPreencher = document.getElementById('menuPreencher');
            
            if (menuAnamnese) menuAnamnese.style.display = isGestor ? 'block' : 'none';
            if (menuPreencher) menuPreencher.style.display = (isProfessor || isSaude) ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
    }
}

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const user = await checkAuth();
    if (!user) return;
    
    // Carregar informações do usuário
    await loadUserInfo();
});