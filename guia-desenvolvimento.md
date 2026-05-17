# Guia Básico de Desenvolvimento - Safe Balance

Bem-vindo ao desenvolvimento do **Safe Balance**! Este guia foi feito para te ajudar a se familiarizar rapidamente com a estrutura do projeto, onde as coisas estão e como você pode começar a contribuir.

## 🚀 Tecnologias Principais

Este projeto utiliza um stack moderno, sendo estruturado como um monorepo (usando Turborepo). As tecnologias principais são:
- **Next.js (App Router)**: Framework React para a aplicação web.
- **Tailwind CSS**: Para estilização e design.
- **pnpm**: Gerenciador de pacotes do projeto (evite usar `npm` ou `yarn` para instalar dependências).

Para rodar o projeto localmente, utilize o comando no terminal (na pasta raiz):
```bash
pnpm dev
```

---

## 📂 Estrutura de Pastas e Onde Editar

Por ser um monorepo, o código é dividido principalmente entre **Aplicativos (`apps/`)** e **Pacotes (`packages/`)**.

### 1. Onde estão as Páginas e as Rotas?
Toda a lógica de roteamento do sistema principal está no diretório:
👉 `apps/saas/app/`

O Next.js usa o **App Router**. Isso significa que as pastas definem as rotas (URLs) da aplicação, e os arquivos `page.tsx` são o conteúdo principal de cada página. 

- **Para criar uma nova rota**: Você deve criar uma nova pasta dentro de `apps/saas/app/(authenticated)/` (se a página for acessível apenas com login) ou `apps/saas/app/(unauthenticated)/` (se for pública), e dentro dela criar um arquivo `page.tsx`.

### 2. Onde estão as páginas de "Minhas Aeronaves"?
Se você precisar editar ou entender como funciona a listagem e os cálculos das aeronaves, as páginas estão localizadas no caminho:
👉 `apps/saas/app/(authenticated)/(main)/(account)/aircraft-profiles/`

Nesta pasta, você encontrará:
- `page.tsx`: A página principal de listagem/gerenciamento de aeronaves.
- `[profileId]/page.tsx`: A página de detalhes de uma aeronave específica.
- `[profileId]/calculate/page.tsx`: A interface de cálculo de peso e balanceamento (CG).

### 3. Onde estão os Componentes Reutilizáveis?
Para manter o código organizado, nossos componentes de interface gráfica (Botões, Modais, Inputs, etc.) ficam separados em um pacote próprio, que pode ser encontrado em:
👉 `packages/ui/components/`

Sempre que precisar editar um componente visual genérico ou criar um novo que seja usado em várias páginas, faça isso na pasta `packages/ui/`. Nas páginas (`apps/saas`), nós apenas importamos e utilizamos esses componentes.

### 4. Onde fica o CSS e Estilização?
O projeto utiliza **Tailwind CSS**, então a grande maioria da estilização é feita diretamente nos arquivos `.tsx` através das classes (`className="bg-blue-500 text-white..."`).

Se você precisar mexer no CSS global ou variáveis de cor raiz, o arquivo global encontra-se em:
👉 `apps/saas/app/globals.css`

Também utilizamos um sistema de temas e design system moderno. Procure usar as classes já pré-configuradas do Tailwind e os componentes do `packages/ui` para manter a consistência estética do projeto.

### 5. Outros Pacotes Importantes (`packages/`)
A lógica de negócio também está dividida em pacotes modulares na pasta `packages/`:
- `packages/i18n/`: Textos e traduções do sistema (traduções para Português, Inglês, etc.).
- `packages/api/` e `packages/database/`: Lógica de comunicação com o banco de dados e as definições de schemas.
- `packages/mail/`: Lógica para envio de emails (como os relatórios de PDF de balanceamento).

---

## 🛠️ Dicas Básicas

1. **Evite regras de CSS puro (Vanilla CSS) sempre que possível**. Use as classes do TailwindCSS.
2. **Componentize**. Se um bloco de código de UI for usado em mais de uma rota, transforme em um componente dentro de `packages/ui`.
3. **Padrão de nomenclatura**. Tente seguir os padrões já estabelecidos nos arquivos. Arquivos de componente em CamelCase (`Button.tsx`), rotas minúsculas com hífen, etc.

Qualquer dúvida, explore os arquivos existentes. O código antigo é o melhor professor para aprender como adicionar coisas novas! Bom trabalho!