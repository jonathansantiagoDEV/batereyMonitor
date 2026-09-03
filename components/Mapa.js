export default function Mapa({entregadores=[]}){
 return <div>{entregadores.map((e)=><div key={e.id}>🛵 {e.nome}</div>)}</div>
}
