# Laboratório da Água — Atualização v2 (aditiva)

**A versão 1 continua com os cinco módulos, a avaliação original de 16 questões e todas as notas históricas.** A v2 acrescenta uma aba **Avançado ✦**, sem substituir conteúdo, contas ou histórico do nível inicial.

## Antes de começar: cópia de segurança

1. No GitHub, entre no seu repositório `energia-hidraulica-feira` e baixe um ZIP de backup (`Code` → `Download ZIP`) ou registre o commit atual para permitir um rollback.
2. **Guarde o `config.js` que já está funcionando na conta!** O `config.js` deste ZIP é apenas um arquivo-modelo do pacote antigo. **NÃO substitua seu `config.js` existente**, pois ele contém a URL e a chave pública de conexão do seu Supabase.
3. Guarde o banco: este pacote NÃO apaga nenhuma tabela existente, mas exportar um backup do Supabase antes da migração é boa prática.

## Etapa 1 — banco (faça antes de publicar os arquivos)

No mesmo projeto Supabase atual, abra **SQL Editor** → **New query** e execute **APENAS `upgrade_v2.sql`**. É uma migração incremental e mantém as tabelas `profiles`, `module_progress` e `exam_attempts` intactas. Ela cria:

- `advanced_progress`: quais dos cinco módulos avançados foram marcados como estudados;
- `advanced_attempts`: nota, módulo, data e acertos por conceito, com prova geral identificada pelo módulo `0`.

As regras RLS restringem os dados aos próprios usuários e responsáveis. As gravações da v2 exigem que o usuário já tenha ao menos uma avaliação inicial **13/16 ou mais**, registrada no banco. Responsáveis também podem responder normalmente para testar, sem afetar as estatísticas dos alunos.

Não execute de novo o `setup.sql` antigo para instalar a v2 e não remova nenhuma conta já existente.

## Etapa 2 — arquivos para subir no GitHub

No repositório existente, atualize/adicione **somente**:

- `index.html` — uma nova aba e uma seção adicionadas à página; módulos e prova da v1 preservados.
- `cloud.js` — 3 integrações aditivas que informam à extensão qual usuário está logado e permitem carregar o relatório novo.
- `advanced-content.js` — 5 módulos aprofundados e 75 versões de perguntas (5 conceitos por módulo × 3 enunciados por conceito).
- `advanced.js` — avaliações, trava de 80%, atualização de desempenho e painel v2.
- `assets/maquete-acumulacao.webp` e `assets/maquete-fio-dagua.webp` — fotos das maquetes do grupo.
- Opcional: `README_V2.md` e `upgrade_v2.sql` para documentar a evolução.

**Mantenha** `config.js`, `setup.sql`, `.nojekyll` e os demais arquivos antigos já hospedados. O seu `config.js` deve permanecer configurado.

Espere o GitHub Pages atualizar. Atualize a página no celular (se necessário, em aba anônima para descartar cache antigo).

## Etapa 3 — como testar sem misturar os dados

1. Entre na plataforma com sua própria conta. Se sua primeira avaliação registrada foi 16/16, a aba **Avançado ✦** já estará disponível.
2. Abra um módulo, leia as seções, toque em **Marcar como estudado** e depois faça a avaliação do módulo (cinco perguntas).
3. Cada novo teste usa outra versão do enunciado e muda as posições das alternativas. **4/5 = 80%**.
4. Estude os cinco módulos e libere a avaliação geral (15 perguntas, 12/15 = 80%).
5. Entre em **Painel** e veja o bloco **Desempenho por módulo avançado** abaixo da tabela da v1. Ele exibe os cinco módulos, nota geral e histórico.
6. Entre como um aluno ainda sem nota suficiente no nível inicial: a seção **Avançado** exibirá o aviso de bloqueio, sem permitir gravar dados no banco.
7. Confirme no Supabase (Table Editor) que as tabelas originais e os resultados da versão inicial continuam presentes.

## Características das perguntas

- 5 perguntas por módulo (uma para cada conceito-chave).
- 3 variações de enunciado para cada conceito, mais embaralhamento das alternativas: 75 enunciados possíveis.
- A avaliação geral seleciona 3 conceitos de cada módulo, totalizando 15 questões em ordem aleatória.
- As tentativas ficam registradas em `advanced_attempts`, juntamente com o resultado de cada conceito; apenas responsáveis podem ver os resultados coletivos.
- **A correção acontece no navegador**, logo a prova é uma ferramenta de aprendizagem informal, não uma avaliação antifraude.

## Conteúdo usado e observações científicas

Foram aproveitados o projeto de feira, cartões ilustrados, explicações dos cinco integrantes, jogos de perguntas e fichas de usinas fornecidos pela família, além dos tópicos científicos discutidos no planejamento. As duas maquetes reais aparecem como ilustrações do nível avançado.

Para maior precisão:

- **Xingó é operada a fio d'água**, embora possua reservatório. **Sobradinho** é o exemplo de regularização rio acima. Veja a [ANA](https://www.gov.br/ana/pt-br/assuntos/noticias-e-eventos/noticias/reservatorio-de-xingo-tera-reducao-da-liberacao-de-agua-para-700m3-s).
- **Uma usina a fio d'água pode ter barragem e até muita potência**; menor área alagada não implica impacto ambiental zero.
- **Itaipu ocupa a terceira posição mundial em capacidade instalada**, atrás de Três Gargantas e Baihetan, segundo a [própria Itaipu](https://www.itaipu.gov.br/institucional/acesso-informacao).
- Para evitar discussão de classificação pelo tamanho do lago, o exemplo-base de acumulação utilizado é **Sobradinho**; Itaipu continua citada como importante geradora e exemplo de turbinas/geradores.
- Reversíveis são **armazenamento**, não geram energia líquida adicional.

## Fontes sugeridas para estudo complementar

- ANA: https://www.gov.br/ana/pt-br/assuntos/noticias-e-eventos/noticias/reservatorio-de-xingo-tera-reducao-da-liberacao-de-agua-para-700m3-s (se o link mudar, busque pelo título na ANA).
- ANA, Sobradinho: https://www.gov.br/ana/pt-br/assuntos/noticias-e-eventos/noticias/com-maior-reservatorio-do-nordeste-hidreletrica-de-sobradinho-ba-volta-a-registrar-100-de-armazenamento-pela-primeira-vez-desde-2009
- Itaipu: https://www.itaipu.gov.br/institucional/acesso-informacao
- IHA: https://www.hydropower.org
- EPE: https://www.epe.gov.br

## Privacidade e segurança

O GitHub Pages publica o código das perguntas e as fotos das maquetes abertamente. As notas e identidades de login NÃO ficam no código público; permanecem no Supabase, protegidas por autenticação e RLS. Não publique chaves `service_role`, tokens de acesso ou senhas no repositório. Se quiser ocultar as respostas das perguntas do código público, precisaremos de uma arquitetura diferente, com correção no servidor, desnecessária para este exercício escolar.

## Caso apareça alguma dificuldade

- **"Nível 2 ainda precisa da atualização SQL"**: execute `upgrade_v2.sql` no projeto Supabase correto.
- **Trava permanece após conseguir 16/16**: confirme se a avaliação inicial foi registrada **online** na conta logada. Um resultado que só está no `localStorage` não satisfaz a política RLS do banco.
- **Aba Avançado não aparece**: confirme que `index.html` atualizou no GitHub Pages e recarregue sem cache.
- **Não consegue entrar**: restaure o `config.js` antigo configurado.

**Escopo excluído desta atualização:** competição pública de visitantes e QR Code, que serão adicionados em uma etapa separada, sem misturar visitantes com as contas de estudo.
