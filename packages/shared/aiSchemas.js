export const AI_OUTPUT_SCHEMA = `
{
  "summary": "Texto do resumo aqui...",
  "insights": [
    {"text": "Dica de negócio...", "confidence": "high"}
  ],
  "kpis": [
    {"label": "Faturamento Total", "value": 1500.50, "unit": "R$"}
  ],
  "charts": [
    {
      "type": "bar | line | pie | donut | area | table | multi-bar | multi-line | scatter",
      "title": "Título do Gráfico",
      "description": "Explicação curta do que estamos vendo",
      "columns": ["Nome da Categoria (Eixo X)", "Valor Numérico (Eixo Y)"],
      "data_rows": [
        ["Categoria A", 150],
        ["Categoria B", 300]
      ]
    }
  ],
  "meta": {
    "rows_sampled": 30,
    "warnings": ["Aviso se houver dados faltando"]
  }
}`;

