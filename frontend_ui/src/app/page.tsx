import Header from '@/components/layout/Header';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-red-900 selection:text-white">
      <Header />
      
      <main className="flex-grow flex flex-col gap-12 mt-8">
        <Hero />
        <Features />
      </main>
      
      <Footer />
    </div>
  );
}
