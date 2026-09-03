export default function Stars({ rating=0, size='sm' }) {
  const sz = size==='lg'?'text-2xl':size==='md'?'text-lg':'text-sm';
  return <span className={sz}>{[1,2,3,4,5].map(i=><span key={i} className={i<=Math.round(rating)?'text-[#F59E0B]':'text-gray-300'}>★</span>)}</span>;
}
