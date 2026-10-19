# Laboratório da Água — Correção v3 (19/10/2026)

Atualização **sem mudanças no banco de dados**. A versão inicial (5 módulos e 16 questões), a configuração atual do Supabase, as fotos e os históricos de notas anteriores continuam intactos. O pacote inclui apenas arquivos necessários para atualizar o nível avançado.

## Passos seguros para publicar no GitHub Pages

1. Faça uma cópia de segurança do repositório atual (`Code` → `Download ZIP`) ou registre o commit anterior.
2. Abra o repositório `energia-hidraulica-feira` e **substitua** na raiz **somente estes três arquivos** pelos arquivos deste pacote:
   - `index.html`
   - `advanced.js`
   - `advanced-content.js`
3. Faça o commit. Aguarde o GitHub Pages concluir a publicação.
4. No celular, recarregue o site. Se vir o conteúdo antigo, teste em aba anônima para contornar cache do navegador. Os scripts avançados agora usam `?v=3` para diminuir o risco de cache antigo.
5. **Não altere** `config.js`, `cloud.js`, `upgrade_v2.sql`, `setup.sql`, as fotos, senhas ou contas existentes. **Não é necessário executar SQL** nesta atualização.

## O que mudou

- Módulo 1: incluiu o **Moinho das Hortências**, ainda em atividade em Teresópolis, que usa roda-d'água para moer milho; corrigiu a história de **Marmelos Zero**, que inaugurou em 1889 **gerando eletricidade desde o começo**.
- Módulo 2: acrescentou o **vertedouro** e sua diferença em relação ao conduto forçado.
- Módulo 3: linguagem `barragem` no lugar de `barramento`.
- Módulo 4: título passou a dizer **rio São Francisco**, e há nota para distinguir **Xingó (usina no São Francisco)** de **Xingu (rio de Belo Monte)**.
- Questões do nível avançado: banco reconstruído e revisado com **25 perguntas de enunciado único**, cinco por módulo. As alternativas e a sequência são embaralhadas entre tentativas; a avaliação geral sorteia 3 questões de cada módulo, total de 15. Foi removida a estratégia de três enunciados por resposta que resultava em perguntas sem sentido.
- Resultado: cada correção mostra **imediatamente nota, porcentagem e explicações**, sem esperar a conexão com Supabase. Há botão para **estudar o próximo módulo**; após o módulo 5, botão de **avaliação geral**.
- Início do nível avançado: a **melhor nota da avaliação geral** aparece junto das notas dos módulos.
- Sincronização: se o login expirar ou a rede falhar, a correção continua funcionando e a tentativa é preservada **neste dispositivo/navegador** em fila local. Uma indicação avisa quando a nota ainda não chegou ao painel. A criança pode tocar em **Sincronizar nota** após reconectar; o portal também tenta sincronizar novamente ao entrar na conta e abrir o nível avançado.

## Diagnóstico do problema na correção

A versão anterior tentava acessar `evt.currentTarget` **depois de uma operação assíncrona (`await`)**. O navegador não garante que essa referência continue disponível ao final do evento, gerando exceção e impedindo a exibição do resultado. A versão corrigida preserva a referência ao formulário e, principalmente, corrige todas as respostas **antes** de iniciar qualquer gravação online.

## Testes

Executados testes automatizados locais de fluxo com navegador (HTML/JS renderizados em memória): cinco avaliações dos módulos (5/5 em cada), avaliação geral (15/15), navegação para o módulo seguinte e nota geral exibida no início; nenhum erro JavaScript detectado nesses cenários. Também foi simulado erro de gravação online: a nota continuou aparecendo, foi preservada localmente e a operação de sincronizar conseguiu salvar a tentativa posteriormente.

**Limitação:** não temos acesso ao Supabase real desta família. A gravação no banco precisa ser conferida no portal publicado com uma conta de teste. Notas de avaliações antigas (inclusive as questões problemáticas da v2) são preservadas no histórico e continuam participando do cálculo da melhor nota.

## Referências históricas

- Moinho das Hortências — Prefeitura de Teresópolis: https://teresopolis.rj.gov.br/noticias/turismo/museu-do-colono-memoria-gastronomia-e-turismo-1568
- Usina Marmelos Zero — Memória da Eletricidade: https://memoriadaeletricidade.com.br/acervo/31130/usina-hidreletrica-marmelos-zero
