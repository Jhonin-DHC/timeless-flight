import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main className="container-shell py-8 md:py-12">{children}</main>
      <Footer />
    </CartProvider>
  );
}
