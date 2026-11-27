import Link from 'next/link';
import CabinetLayout, { C } from '../../../components/cabinet/CabinetLayout';

// Временная страница: пошаговая форма проекта появится в следующем обновлении
export default function ProjectFormSoon() {
  return (
    <CabinetLayout title="Proje">
      <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Proje formu hazırlanıyor</h1>
        <p style={{ color: C.muted, margin: '0 0 14px' }}>Bu bölüm çok yakında açılacak.</p>
        <Link href="/gelistirici" style={{ color: C.green, fontWeight: 700 }}>← Panele dön</Link>
      </div>
    </CabinetLayout>
  );
}
