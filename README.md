# Laboratório da Água — Energia Hidráulica

Material didático online para os cinco alunos (Ícaro, Théo, Heitor, Miguel e Lucas),
com cinco módulos, roteiro de apresentação, simulação e avaliação de 16 perguntas.
Os responsáveis podem acompanhar notas e progresso num painel privado.

## 1. Publicar agora no GitHub Pages

1. GitHub → **+** → **New repository**.
2. Nome sugerido `energia-hidraulica-feira`; visibilidade **Public**.
3. `Add file` → `Upload files`: envie `index.html`, `cloud.js`, `config.js`, `setup.sql`, `README.md` e `.nojekyll` (se não aparecer, é opcional).
4. **Commit changes** na branch `main`.
5. **Settings** → **Pages** → **Build and deployment** → **Deploy from a branch**, `main` e `/(root)` → **Save**.
6. Seu endereço será **https://SEU_USUARIO.github.io/energia-hidraulica-feira/**, se o repositório tiver esse nome. O site pode demorar alguns minutos para aparecer.

Sem configurar o banco, o material já funciona, mas os dados ficam apenas
no navegador local. Para acompanhar TODOS os alunos, continue.

## 2. Criar projeto Supabase (banco + login + painel)

1. Entre em https://supabase.com/dashboard e crie um projeto na sua organização.
2. Abra **SQL Editor** e execute todo o bloco de criação de tabelas e policies
   de `setup.sql` (até a parte de cadastro de alunos, que só terá resultado após
   criar as contas de usuário).
3. Em **Authentication → Providers → Email**, deixe o provedor de e-mail ativo.
   Recomenda-se desativar **Allow new users to sign up** para evitar inscrições públicas.
4. Em **Authentication → Users**, **Add user → Create new user**, crie sete contas,
   com senhas exclusivas e fortes (pelo menos 8 caracteres):
   - Ícaro: `icaro@alunos.example`
   - Théo: `theo@alunos.example`
   - Heitor: `heitor@alunos.example`
   - Miguel: `miguel@alunos.example`
   - Lucas: `lucas@alunos.example`
   - Pai: seu e-mail real
   - Mãe: e-mail real dela

   Use a opção de confirmação de e-mail do formulário administrativo ao criar
   as contas. Endereços `@alunos.example` são IDENTIFICADORES DE ACESSO,
   não caixas de e-mail e não recebem mensagens. **Não use o cadastro público**.
5. Rode novamente o bloco de cadastro de alunos de `setup.sql`; em seguida,
   descomente as duas instruções de cadastro de responsáveis, inserindo seus
   e-mails reais (exatamente como cadastrados) e execute cada uma.
6. Verifique que `public.profiles` tem sete linhas: cinco com `student` e duas
   com `guardian`. Apenas o papel guardian enxerga notas de todas as contas.

## 3. Conectar o site ao banco

1. No Supabase, encontre em **Project Settings → API Keys / Data API**:
   - **Project URL** (ex.: `https://xxxx.supabase.co`)
   - chave **publishable** (`sb_publishable_...`) ou antiga chave **anon**.
2. Abra `config.js` no GitHub e use o botão Edit (lápis).
3. Preencha `supabaseUrl` e `supabasePublishableKey`.
4. Faça **Commit changes** e aguarde a atualização do GitHub Pages.
5. Reabra a página em aba anônima para verificar o formulário de login.

**SEGURANÇA:** a chave publishable/anon é projetada para o browser, mas
NUNCA publique a **secret** ou **service_role**. Todas as tabelas estão protegidas
com políticas de segurança por linha (RLS). Os nomes completos das crianças
não são necessários. Guarde as senhas dos alunos somente com os responsáveis.
O código HTML de estudo é público; as notas do painel são privadas.

## 4. Como testar

1. Faça login como Ícaro, leia o primeiro módulo e pressione **Marcar como estudado**.
2. Vá até Avaliação e responda às 16 questões; veja a nota e a explicação.
3. Saia da conta e entre como um responsável com e-mail e senha.
4. Clique em **Painel**, pressione **Atualizar resultados** e verifique a nota
   e `1/5` de módulos do Ícaro.
5. Faça uma avaliação na conta do responsável: ela aparece separadamente no
   painel, sem afetar o desempenho das crianças.

**Limite didático:** a correção do exame acontece no navegador. Isso é adequado
para diagnóstico de aprendizagem informal, mas não equivale a uma prova
inviolável para fins oficiais. O painel registra o momento em que cada aluno
marca o módulo como concluído, não mede automaticamente o tempo de leitura.

## 5. Arquitetura

- `index.html`: conteúdo e avaliação local (HTML/CSS/JS puro).
- `config.js`: URL e chave pública do Supabase.
- `cloud.js`: login, armazenamento de progresso, notas e painel privado.
- `setup.sql`: tabelas PostgreSQL e RLS.
- `README.md`: instruções de configuração.
- `.nojekyll`: deixa o GitHub Pages servir arquivos estáticos diretamente.

A plataforma usa um CDN para carregar `supabase-js@2` quando o banco está ligado.
Não há necessidade de Node, build nem servidor próprio.

### Escopo futuro

O QUIZ DOS VISITANTES é uma etapa separada. Os dados e os usuários do quiz
não se misturam às notas e aos perfis privados dos alunos. A escolha do formato
(tempo, ranking, apelido, equipes, QR Code) pode ser feita após a etapa de estudo.
