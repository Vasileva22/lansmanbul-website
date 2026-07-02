import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      // Запрашиваем данные из таблицы properties
      const { data, error } = await supabase
        .from('properties')
        .select('*');
      
      if (error) {
        console.error('Ошибка загрузки данных:', error);
      } else {
        setProperties(data);
      }
      setLoading(false);
    }

    fetchProperties();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#111', fontSize: '32px', fontWeight: 'bold' }}>LansmanBul</h1>
        <p style={{ color: '#666' }}>Платформа агрегатора недвижимости Анкары</p>
      </header>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#999' }}>Загрузка объявлений...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {properties.map((item) => (
            <div key={item.id || item.Номер} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
              <span style={{ fontSize: '12px', color: '#0070f3', fontWeight: 'bold', textTransform: 'uppercase' }}>Объявление №{item.Номер}</span>
              <h3 style={{ margin: '10px 0', color: '#222', fontSize: '20px' }}>{item['İlçe/Semt'] || 'Район не указан'}</h3>
              <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}><strong>Адрес/Координаты:</strong> {item.adress || 'Нет данных'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}