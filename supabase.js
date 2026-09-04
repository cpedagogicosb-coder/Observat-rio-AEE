// ===== CONFIGURAÇÃO DO SUPABASE =====
const SUPABASE_URL = 'https://gtbbcltfzgqnwkahpnxd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lEmKv5RZTrP3bZ33WFFsbg_wvrNgAco';

// Inicializa o cliente Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Exporta para uso em outros scripts (se necessário)
window.supabaseClient = supabaseClient;

// ===== FUNÇÕES AUXILIARES =====

/**
 * Obtém o usuário atualmente logado
 */
async function getCurrentUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) {
        console.error('Erro ao obter usuário:', error.message);
        return null;
    }
    return user;
}

/**
 * Busca o perfil de um usuário pelo ID
 */
async function getUserProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Erro ao buscar perfil:', error.message);
        throw error;
    }
    return data;
}

/**
 * Lista todos os estudantes ativos
 */
async function getEstudantes() {
    const { data, error } = await supabaseClient
        .from('estudantes')
        .select('*')
        .eq('ativo', true)
        .order('nome_completo');
    
    if (error) {
        console.error('Erro ao buscar estudantes:', error.message);
        throw error;
    }
    return data;
}

/**
 * Lista todas as categorias da anamnese
 */
async function getCategoriasAnamnese() {
    const { data, error } = await supabaseClient
        .from('categorias_anamnese')
        .select('*')
        .eq('ativo', true)
        .order('ordem');
    
    if (error) {
        console.error('Erro ao buscar categorias:', error.message);
        throw error;
    }
    return data;
}

/**
 * Lista todas as perguntas da anamnese
 */
async function getPerguntasAnamnese() {
    const { data, error } = await supabaseClient
        .from('perguntas_anamnese')
        .select('*')
        .eq('ativo', true)
        .order('ordem');
    
    if (error) {
        console.error('Erro ao buscar perguntas:', error.message);
        throw error;
    }
    return data;
}

/**
 * Busca as respostas da anamnese de um estudante específico
 */
async function getRespostasAnamnese(estudanteId) {
    const { data, error } = await supabaseClient
        .from('respostas_anamnese')
        .select('*')
        .eq('estudante_id', estudanteId);
    
    if (error) {
        console.error('Erro ao buscar respostas:', error.message);
        throw error;
    }
    return data;
}