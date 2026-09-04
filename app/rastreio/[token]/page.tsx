import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TEXTO_STATUS: Record<string, string> = {
  PENDENTE: 'Aguardando saída para entrega',
  EM_ROTA: 'Pedido a caminho',
  ENTREGUE: 'Pedido entregue com sucesso',
  CANCELADO: 'Entrega cancelada',
};

export default async function RastreioPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getSupabaseAdmin();

  const { data: entrega } = await supabase
    .from('entregas')
    .select('*')
    .eq('token_rastreio', token)
    .single();

  if (!entrega) {
    return (
      <main className="p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">Entrega não encontrada</h1>
        <p className="text-gray-600 mt-2">
          Verifique o link digitado e tente novamente.
        </p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Acompanhar Entrega</h1>
      <div className="bg-white p-4 rounded shadow border">
        <p className="text-sm text-gray-500">Código de Rastreio:</p>
        <p className="font-mono text-lg font-bold mb-3">{token}</p>

        <p className="text-sm text-gray-500">Status Atual:</p>
        <p className="text-lg font-semibold text-blue-600">
          {TEXTO_STATUS[entrega.status] || entrega.status}
        </p>
      </div>
    </main>
  );
}