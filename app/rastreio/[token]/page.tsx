import { supabaseAdmin } from '@/lib/supabaseAdmin';

const TEXTO_STATUS: Record<string, string> = {
  PENDENTE: 'Aguardando saída para entrega',
  EM_ROTA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
};

// Página pública (sem login) para o cliente final acompanhar a entrega
// pelo link /rastreio/[token]. Usa o service role (supabaseAdmin) porque
// as policies de RLS de "entregas" exigem auth.uid() — ver o comentário em
// supabase/migrations/2026_add_token_rastreio.sql.
export default async function Rastreio({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: entrega, error } = await supabaseAdmin
    .from('entregas')
    .select('id, status, cliente, endereco, created_at')
    .eq('token_rastreio', token)
    .single();

  if (error || !entrega) {
    return (
      <main className="p-6 max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold mb-2">Entrega não encontrada</h1>
        <p className="text-gray-600">Verifique o link de rastreio recebido.</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Acompanhe sua entrega</h1>
      <div className="border rounded p-4 space-y-2">
        <p><strong>Cliente:</strong> {entrega.cliente || 'Não informado'}</p>
        <p><strong>Endereço:</strong> {entrega.endereco || 'Não informado'}</p>
        <p><strong>Status:</strong> {TEXTO_STATUS[entrega.status] || entrega.status}</p>
      </div>
    </main>
  );
}
