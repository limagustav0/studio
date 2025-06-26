
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2 flex items-center">
        <Image 
            src="https://seller.epocacosmeticos.com.br/app/assets/images/company_image/66a29895f35d0.png"
            alt="Época Cosméticos Logo"
            width={180}
            height={40}
            priority
        />
      </div>
    </header>
  );
}
