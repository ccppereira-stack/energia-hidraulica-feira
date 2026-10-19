# Laboratório da Água — V4: sincronização e roteiros individuais (19/10/2026)

## O que muda

- **Notas do nível avançado**: removida uma consulta JSON prévia potencialmente problemática. O portal envia diretamente a nota usando `client_attempt_id`; um índice único no PostgreSQL impede duplicação durante reenvios. Reforçadas mensagens de erro no próprio portal e botão de sincronização sempre visível quando há notas pendentes.
- **Notas pendentes**: permanecem no navegador da mesma pessoa e dispositivo até a sincronização. O portal tenta reenviá-las automaticamente ao entrar e oferece o botão **Sincronizar notas pendentes** na abertura do nível avançado. O estado do envio aparece na avaliação.
- **Apresentação**: cinco títulos identificados com o nome de cada aluno (Ícaro, Théo, Heitor, Miguel, Lucas), palavras-chave, frase-chave, texto-base de cerca de um minuto e dicas para apontar as maquetes.
- Conteúdo e provas dos módulos, fotos, perfis, notas básicas e progresso **não foram alterados**.

## Publicação (IMPORTANTE: ordem)

1. **Faça backup** do repositório antes da mudança (`Code → Download ZIP`) e lembre o commit atual.
2. No **Supabase → SQL Editor**, execute **`upgrade_v4.sql`**. Pode ser reexecutado; não apaga histórico. Confirme que o `SELECT` final informa a coluna `client_attempt_id`. **Não reexecute** os arquivos `setup.sql` e `upgrade_v2.sql`.
3. No repositório GitHub Pages, **substitua apenas `index.html` e `advanced.js`** pelos arquivos do ZIP. Não altere `config.js`, `cloud.js`, `advanced-content.js`, imagens, chaves ou demais arquivos.
4. Aguarde GitHub Pages atualizar. Abra em aba anônima para evitar cache se o navegador mostrar versão antiga. O script avançado passará a carregar como `advanced.js?v=4`.
5. Entre na sua conta que tinha notas pendentes. Vá a **Avançado** e verifique a faixa **Notas aguardando sincronização**. Aguarde a tentativa automática ou toque em **Sincronizar notas pendentes**.
6. Abra **Painel → Atualizar nível avançado** e confirme a nota no módulo correspondente. A avaliação geral também deve aparecer. Teste uma nova avaliação após confirmar as notas antigas.

## Se a sincronização continuar falhando

A mensagem do portal mostra um diagnóstico na faixa amarela e no resultado da avaliação. Envie uma captura desse texto (preferencialmente também o `code` e o `message` da resposta do Supabase em Ferramentas do desenvolvedor → Network). Não compartilhe senhas, tokens, credenciais, `service_role` ou cabeçalhos de autenticação. Erros típicos:

- `PGRST204` ou aviso `client_attempt_id`: execute a migração `upgrade_v4.sql` e aguarde o cache do Supabase ser atualizado.
- `42501` ou RLS: conferir se o usuário atingiu **13/16 na avaliação inicial** no banco e se a política `advanced_attempts_insert` está ativa. O bloqueio de acesso é aplicado no servidor, não apenas na interface.
- `401`/sessão expirada: sair e entrar na conta novamente. As respostas continuam salvas localmente.
- Problemas de internet: aguarde, reconecte e use o botão **Sincronizar notas pendentes**.

**Limitação de diagnóstico**: não tenho as credenciais do seu Supabase; portanto, não tenho como garantir antecipadamente qual era o código do erro no seu projeto. Esta correção elimina uma etapa frágil e passa a exibir o erro do banco em vez de falhar silenciosamente. O histórico na nuvem só é atualizado depois que o banco confirma a gravação.

## Roteiros

Seção **Apresentação**: textos para cada criança com duração aproximada de 1 minuto **falado**. Cronometrem cada aluno apontando partes das maquetes; o total pode ficar em torno de 6 a 7 minutos com transições e participação do público. Os textos servem como base; não precisam ser decorados palavra por palavra.
