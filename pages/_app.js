import { Mulish } from 'next/font/google';
import '../styles/globals.css';

// Настраиваем оптимизированную загрузку шрифта Mulish
const mulish = Mulish({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-mulish', // Создаем CSS-переменную для использования в стилях
});

export default function App({ Component, pageProps }) {
  return (
    <main className={mulish.className}>
      <Component {...pageProps} />
    </main>
  );
}
