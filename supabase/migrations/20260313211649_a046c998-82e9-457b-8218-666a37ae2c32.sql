
-- Aula: Como Montar o Currículo Perfeito
DO $$
DECLARE
  _lesson_id uuid := gen_random_uuid();
  _activity_id uuid := gen_random_uuid();
BEGIN

-- 1. Lesson
INSERT INTO public.lessons (id, module_id, title, description, sort_order, min_score)
VALUES (
  _lesson_id,
  'f4ebbf85-ed79-4ab6-881f-dce06fcbe16b',
  'Como Montar o Currículo Perfeito',
  'Aprenda a criar um currículo que chame a atenção de recrutadores e inteligências artificiais, com dicas práticas para cada seção.',
  1,
  70
);

-- 2. Activity (quiz)
INSERT INTO public.activities (id, activity_type, title)
VALUES (_activity_id, 'multiple_choice', 'Quiz: Currículo Perfeito');

-- 3. Lesson Steps (5 supplementary + 1 quiz)

-- Step 1: Introdução
INSERT INTO public.lesson_steps (lesson_id, title, step_type, sort_order, content_body)
VALUES (_lesson_id, 'O que é um Currículo de Vida', 'supplementary', 0,
'<h2>O que é um Currículo de Vida?</h2>
<p>O currículo é o seu cartão de apresentação para o mercado de trabalho. Ele precisa ser <strong>simples, objetivo e adaptado para cada vaga</strong>.</p>
<p>Hoje, muitas empresas usam <strong>Inteligências Artificiais (IAs)</strong> para fazer a primeira triagem de currículos. Isso significa que seu currículo precisa ser claro o suficiente para que tanto humanos quanto máquinas consigam entender suas informações.</p>
<h3>💡 Dica de Ouro</h3>
<p><strong>Faça um currículo para cada vaga que for aplicar!</strong> Insira o nome da empresa, saiba o que ela faz e use informações que estão disponíveis na descrição da vaga. Isso faz as IAs identificarem você como alinhado com a oportunidade.</p>
<h3>Para quem é este material?</h3>
<ul>
<li>Jovens buscando o primeiro emprego</li>
<li>Pessoas que estão fora do mercado há algum tempo</li>
<li>Profissionais que querem melhorar seu currículo</li>
</ul>
<p>As empresas estão preferindo contratar pessoas com <strong>bons comportamentos</strong> ao invés de currículos super graduados. Então, valorize quem você é!</p>');

-- Step 2: Informações Pessoais
INSERT INTO public.lesson_steps (lesson_id, title, step_type, sort_order, content_body)
VALUES (_lesson_id, 'Informações Pessoais e Contatos', 'supplementary', 1,
'<h2>Informações Pessoais e Contatos</h2>
<h3>📝 Seu Nome</h3>
<p>Coloque seu <strong>nome completo em letras grandes</strong>, bem visível no topo do currículo.</p>
<h3>🎯 Nome da Vaga</h3>
<p>Logo abaixo do nome, escreva o <strong>nome exato da vaga</strong> como a empresa anunciou. Nada de "vaga genérica"!</p>
<h3>👤 Dados Pessoais</h3>
<ul>
<li><strong>Idade</strong> (não a data de nascimento)</li>
<li>Estado civil</li>
<li>Quantidade de filhos (ou "sem filhos")</li>
<li>Cidade e bairro de residência</li>
</ul>
<p>⚠️ <strong>NÃO coloque:</strong> RG, CPF ou foto.</p>
<h3>📞 Contatos</h3>
<p>Coloque pelo menos <strong>2 opções de contato</strong>: seu telefone pessoal e um telefone de recado (com o nome do contato).</p>
<h3>📧 E-mail</h3>
<p>Use um e-mail profissional com seu nome. Se não tem, crie um como: <code>seunomecompleto00@gmail.com</code></p>
<h3>🔗 LinkedIn</h3>
<p>Ter um LinkedIn reforça seu interesse em trabalhar. Se é primeiro emprego e não tem, tudo bem — apenas remova essa linha.</p>');

-- Step 3: Objetivo Profissional
INSERT INTO public.lesson_steps (lesson_id, title, step_type, sort_order, content_body)
VALUES (_lesson_id, 'Objetivo Profissional', 'supplementary', 2,
'<h2>Objetivo Profissional</h2>
<p>⚠️ <strong>Cuidado com essa parte!</strong> É aqui que muitos candidatos são descartados por recrutadores e IAs.</p>
<h3>❌ O que NÃO fazer</h3>
<p>Não use frases genéricas como: <em>"Trabalhar nessa conceituada empresa para fazer o que for pedido"</em>. Isso mostra que você não sabe o que vai fazer no cargo.</p>
<h3>✅ Como escrever corretamente</h3>
<p>Pesquise sobre as tarefas do cargo e escreva de forma objetiva:</p>
<blockquote>
<p><strong>Objetivo:</strong> Exercer a função de <em>[nome da função]</em>, com o salário pretendido de <em>[média salarial pesquisada]</em>, executando as tarefas de <em>[descreva as principais tarefas do cargo]</em>.</p>
</blockquote>
<h3>💡 Dicas</h3>
<ul>
<li>Pesquise a média salarial do cargo no Brasil</li>
<li>Leia a descrição da vaga com atenção e use as mesmas palavras</li>
<li>Seja específico sobre o que você sabe fazer naquela função</li>
</ul>');

-- Step 4: Competências e Educação
INSERT INTO public.lesson_steps (lesson_id, title, step_type, sort_order, content_body)
VALUES (_lesson_id, 'Competências e Educação', 'supplementary', 3,
'<h2>Competências e Educação</h2>
<h3>🧠 Competências</h3>
<p>Aqui é onde você mostra <strong>quem você é</strong>. As empresas buscam pessoas com bom comportamento profissional!</p>
<p>Modelo para escrever:</p>
<blockquote>
<p>Sou considerado(a) <em>[qualidade]</em> pelas pessoas ao meu redor pois <em>[explique por quê]</em>. Tenho facilidade em <em>[outra competência]</em>, visto que quando <em>[situação onde usou]</em> tive bons resultados.</p>
</blockquote>
<p>⚡ <strong>Importante:</strong> Coloque competências que são úteis para a vaga que está se candidatando!</p>
<h3>🎓 Educação Formal</h3>
<p>Coloque apenas sua <strong>última formação</strong>. Exemplos:</p>
<ul>
<li><em>Cursando 2º ano do ensino médio na escola X</em></li>
<li><em>Ensino médio completo na escola X, em 20XX</em></li>
<li><em>Cursando 3º ano de Administração na faculdade X</em></li>
</ul>
<h3>📚 Educação Informal (Cursos Livres)</h3>
<p>Muito importante! Mostra que você se atualiza mesmo fora da escola ou faculdade.</p>
<p>Descreva <strong>o que aprendeu</strong> no curso, não a grade programática:</p>
<blockquote>
<p><strong>Curso Online de Atendimento ao Cliente - 2020</strong><br/>
Nesse curso aprendi a lidar com a satisfação do cliente, tanto em situações de primeiro atendimento quanto de descontentamento.</p>
</blockquote>
<p>💡 Empresas gostam de pessoas que estudam por conta própria — isso mostra vontade de aprender!</p>');

-- Step 5: Experiências
INSERT INTO public.lesson_steps (lesson_id, title, step_type, sort_order, content_body)
VALUES (_lesson_id, 'Experiências Profissionais e Informais', 'supplementary', 4,
'<h2>Experiências Profissionais e Informais</h2>
<h3>🤝 Experiências Informais (Voluntariado)</h3>
<p>Todas as pessoas têm alguma experiência! O <strong>trabalho voluntário</strong> é muito valorizado porque mostra que você é colaborativo e movido por propósito.</p>
<p>Se nunca fez voluntariado, procure uma ONG — vai trazer experiência rica e melhores oportunidades.</p>
<blockquote>
<p><strong>Lar de Apoio</strong> — ONG de amparo a idosos - 2020<br/>
Realizei trabalho voluntário colaborando para o bem-estar dos idosos, executando tarefas de limpeza, monitoria e recreação.</p>
</blockquote>
<h3>💼 Experiências Profissionais</h3>
<p>Se já tem experiência:</p>
<ul>
<li>Coloque sempre a <strong>última experiência primeiro</strong></li>
<li>Liste no <strong>máximo 3</strong> experiências</li>
<li>Prefira as <strong>relacionadas à vaga</strong></li>
<li>Inclua um breve relato sobre sua atuação</li>
</ul>
<p>Se não tem experiência profissional, <strong>reforce as experiências informais</strong>!</p>
<h3>🚫 Regra de Ouro</h3>
<p><strong>NÃO MINTA em nenhum ponto do currículo!</strong> Mentiras fazem você perder a vaga.</p>
<h3>📋 Resumo Final</h3>
<ul>
<li>✅ Currículo simples e objetivo</li>
<li>✅ Adaptado para cada vaga</li>
<li>✅ Valorize voluntariado e cursos livres</li>
<li>✅ Nunca minta</li>
<li>✅ Comece a fazer voluntariado e cursos para rechear seu currículo!</li>
</ul>');

-- Step 6: Quiz
INSERT INTO public.lesson_steps (lesson_id, title, step_type, sort_order, activity_id)
VALUES (_lesson_id, 'Quiz: Currículo Perfeito', 'quiz', 5, _activity_id);

-- 4. Quiz Questions
INSERT INTO public.activity_questions (activity_id, question_text, options, correct_answer, sort_order)
VALUES
(_activity_id, 'O que NÃO se deve colocar nas informações pessoais do currículo?',
 '["CPF e RG", "Idade", "Estado civil", "Cidade"]', 'CPF e RG', 0),

(_activity_id, 'Como deve ser o objetivo profissional no currículo?',
 '["Descrever as tarefas do cargo", "Fazer o que for pedido", "Escrever uma frase motivacional", "Deixar em branco"]', 'Descrever as tarefas do cargo', 1),

(_activity_id, 'Por que empresas valorizam voluntariado no currículo?',
 '["Mostra colaboração e propósito", "É obrigatório", "Substitui experiência formal", "Aumenta o salário"]', 'Mostra colaboração e propósito', 2),

(_activity_id, 'Quantas experiências profissionais devem ser listadas, no máximo?',
 '["3, as mais relevantes", "Todas que já teve", "Apenas a última", "Nenhuma"]', '3, as mais relevantes', 3),

(_activity_id, 'Por que é recomendado fazer um currículo para cada vaga?',
 '["Para alinhar palavras-chave com a vaga e as IAs", "Porque é mais bonito", "Para gastar mais papel", "Não é recomendado"]', 'Para alinhar palavras-chave com a vaga e as IAs', 4);

END $$;
