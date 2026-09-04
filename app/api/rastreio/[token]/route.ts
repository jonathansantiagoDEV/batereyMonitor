import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: 'Token não informado.' }, { status: 400 });
  }

  const { data: entrega, error } = await supabaseAdmin
    .from('entregas')
    .select('id, status, cliente, endereco, created_at')
    .eq('token_rastreio', token)
    .single();

  if (error || !entrega) {
    return NextResponse.json(
      { error: 'Entrega não encontrada para este código de rastreio.' },
      { status: 404 }
    );
  }

  // Só devolvemos o que o cliente final precisa ver publicamente —
  // nunca IDs internos de entregador, telefone, etc.
  return NextResponse.json({
    id: entrega.id,
    status: entrega.status,
    cliente: entrega.cliente,
    endereco: entrega.endereco,
    criado_em: entrega.created_at,
  });
}
