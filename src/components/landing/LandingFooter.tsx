
export function LandingFooter() {
  return (
    <footer className="py-8 bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CosmoPrice Intel. Todos os direitos reservados.</p>
        <p className="text-xs mt-1">Inteligência de preços para o seu e-commerce de cosméticos.</p>
      </div>
    </footer>
  );
}
