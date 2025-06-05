# Projeto Next.js

Este é um projeto Next.js com TypeScript, Firebase e várias outras dependências.

## Pré-requisitos

- Node.js instalado (versão 18 ou superior)
- npm (gerenciador de pacotes do Node.js)

## Como executar o projeto

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
```

2. Entre na pasta do projeto:
```bash
cd studio
```

3. Instale as dependências:
```bash
npm install
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse a aplicação:
- Abra seu navegador
- Acesse: http://localhost:9002

## Scripts disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento na porta 9002
- `npm run build` - Cria a versão de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa a verificação de linting
- `npm run typecheck` - Verifica os tipos TypeScript

## Configurações importantes

- O projeto está configurado para rodar na porta 9002
- Utiliza Turbopack para desenvolvimento mais rápido
- Configurado para aceitar imagens de vários domínios (placehold.co, cloudinary.com, etc.)
- Possui integração com Firebase
- Utiliza Tailwind CSS para estilização

## Solução de problemas

Se encontrar o erro "ERR_CONNECTION_REFUSED":
1. Verifique se a porta 9002 não está sendo usada por outro processo
2. Certifique-se de que todas as dependências foram instaladas corretamente
3. Tente reiniciar o servidor de desenvolvimento
