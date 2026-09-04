import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getSupabaseAdmin();

  const { data: entrega, error: entregaError } = await supabase
    .from('entregas')
    .select('*')
    .eq('token_rastreio', token)
    .single();

  if (entregaError || !entrega) {
    return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
  }

  let ultimaLocalizacao = null;
  if (entrega.entregador_id) {
    const { data: loc } = await supabase
      .from('historico_localizacao')
      .select('latitude, longitude, criado_em')
      .eq('entregador_id', entrega.entregador_id)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();

    ultimaLocalizacao = loc;
  }

  return NextResponse.json({
    entrega,
    localizacao: ultimaLocalizacao,
  });
}