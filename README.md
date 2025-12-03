
# Chef.ai - App de Cardápios Inteligentes

## 🚨 IMPORTANTE: Primeira Execução

Sempre que baixar este projeto, a primeira coisa a fazer é instalar as ferramentas. Sem isso, dará erro de `'vite' não reconhecido`.

1. Abra o terminal na pasta do projeto.
2. Execute o comando:
```bash
npm install
```
3. Aguarde o download terminar.

## Configuração das Chaves (.env)

1. Crie um arquivo chamado `.env` na raiz do projeto.
2. Preencha com suas chaves:

```env
# OpenAI (Inteligência Artificial)
# Pegue em: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=sk-proj-...

# Supabase (Banco de Dados e Login)
# Pegue em: Project Settings > API
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Stripe (Pagamentos)
STRIPE_PUBLIC_KEY=pk_test_... (ou pk_live_...)

# LINKS DE PAGAMENTO (Payment Links)
# Vá no Stripe > Catálogo de Produtos > Selecione o Produto > Preços > "Criar link de pagamento"
# O link deve começar com https://buy.stripe.com/...
VITE_STRIPE_PRICE_MONTHLY=https://buy.stripe.com/...
VITE_STRIPE_PRICE_QUARTERLY=https://buy.stripe.com/...
VITE_STRIPE_PRICE_ANNUAL=https://buy.stripe.com/...
```

## Como Rodar

Após configurar o .env e rodar o npm install:

```bash
npm run dev
```

## Configuração do Banco de Dados (Supabase)

Para o app funcionar corretamente, você precisa rodar os scripts SQL no **SQL Editor** do Supabase:

1. **Criação das Tabelas:** Copie o conteúdo de `supabase_setup.sql` e rode.
2. **Confirmação de Email Automática:** Copie o conteúdo de `supabase_autoconfirm.sql` e rode.
3. **Correção do Botão Excluir:** Copie o conteúdo de `supabase_fix_delete.sql` e rode (Isso é necessário para a lixeira funcionar).
