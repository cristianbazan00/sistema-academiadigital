

## Criar Aula "Como Montar o Currículo Perfeito" na Trilha Empregabilidade

### Contexto
A trilha "Empregabilidade Juvenil" (id: `0f008c5e-...`) possui o módulo "Mundo do Trabalho" (id: `f4ebbf85-...`) com 1 aula existente (sort_order 0). Vamos criar uma nova aula com sort_order 1.

### Estrutura da Aula

**Aula: "Como Montar o Currículo Perfeito"** (min_score: 70)

| # | Passo | Tipo | Conteúdo |
|---|-------|------|----------|
| 1 | Introdução: O que é um Currículo de Vida | supplementary | Apresentação do conceito (baseado nas páginas 2-4 do PDF): simplicidade, adaptar para cada vaga, importância de IAs lerem o currículo |
| 2 | Informações Pessoais e Contatos | supplementary | Como preencher dados pessoais corretamente: nome grande, vaga exata, idade (não data de nascimento), contatos, e-mail profissional, LinkedIn (páginas 5) |
| 3 | Objetivo Profissional | supplementary | Como escrever o objetivo sem frases genéricas, pesquisar tarefas do cargo, incluir salário pretendido (página 6) |
| 4 | Competências e Educação | supplementary | Como descrever competências comportamentais relevantes para a vaga + educação formal e informal/cursos livres (páginas 7-9) |
| 5 | Experiências Profissionais e Informais | supplementary | Como descrever experiências (últimas 3, mais relevantes primeiro), valorizar voluntariado, não mentir (páginas 10-12) |
| 6 | Quiz: Currículo Perfeito | quiz | 5 perguntas de múltipla escolha sobre os conceitos da aula |

### Quiz — 5 Perguntas

1. **O que NÃO se deve colocar nas informações pessoais do currículo?** → CPF e RG ✓ | Idade | Estado civil | Cidade
2. **Como deve ser o objetivo profissional?** → Descrever as tarefas do cargo ✓ | "Fazer o que for pedido" | Frase motivacional | Deixar em branco
3. **Por que empresas valorizam voluntariado no currículo?** → Mostra colaboração e propósito ✓ | É obrigatório | Substitui experiência formal | Aumenta o salário
4. **Quantas experiências profissionais devem ser listadas, no máximo?** → 3, as mais relevantes ✓ | Todas que já teve | Apenas a última | Nenhuma
5. **Por que é recomendado fazer um currículo para cada vaga?** → Para alinhar palavras-chave com a vaga e as IAs ✓ | Porque é mais bonito | Para gastar mais papel | Não é recomendado

### Implementação

**Migração SQL única** que insere:
1. A aula (`lessons`) no módulo existente
2. Uma atividade (`activities`) do tipo `multiple_choice`
3. Os 6 passos (`lesson_steps`) — 5 supplementary + 1 quiz vinculado à atividade
4. As 5 perguntas (`activity_questions`) com opções e resposta correta

Sem alterações de frontend — a estrutura existente já renderiza aulas, passos e quizzes automaticamente.

