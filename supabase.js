// Configuração do Supabase
const SUPABASE_URL = 'https://gtbbcltfzgqnwkahpnxd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lEmKv5RZTrP3bZ33WFFsbg_wvrNgAco';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Funções auxiliares
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) throw error;
    return data;
}

async function getEstudantes() {
    const { data, error } = await supabase
        .from('estudantes')
        .select('*')
        .eq('ativo', true)
        .order('nome_completo');
    
    if (error) throw error;
    return data;
}

async function getCategoriasAnamnese() {
    const { data, error } = await supabase
        .from('categorias_anamnese')
        .select('*')
        .eq('ativo', true)
        .order('ordem');
    
    if (error) throw error;
    return data;
}

async function getPerguntasAnamnese() {
    const { data, error } = await supabase
        .from('perguntas_anamnese')
        .select('*')
        .eq('ativo', true)
        .order('ordem');
    
    if (error) throw error;
    return data;
}

async function getRespostasAnamnese(estudanteId) {
    const { data, error } = await supabase
        .from('respostas_anamnese')
        .select('*')
        .eq('estudante_id', estudanteId);
    
    if (error) throw error;
    return data;
}