import { GoogleGenAI, Type } from "@google/genai";
import { Category, SmartParseResult } from "../types";

const apiKey = process.env.API_KEY || '';

// Safely initialize AI only if key exists, otherwise we handle it in the UI
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const parseExpenseWithGemini = async (
  text: string, 
  availableCategories: Category[]
): Promise<SmartParseResult | null> => {
  if (!ai) {
    console.warn("API Key not found");
    return null;
  }

  const categoryNames = availableCategories.map(c => c.name).join(", ");
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Hoje é dia ${today}. Analise o seguinte texto: "${text}". 
      Extraia o valor, a melhor categoria correspondente (dentre: ${categoryNames}) e uma descrição curta.
      Se o usuário mencionar uma data específica, use-a no formato YYYY-MM-DD, caso contrário use a data de hoje.
      Se não conseguir encontrar uma categoria exata, sugira a mais próxima ou deixe em branco.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Valor da despesa" },
            categoryName: { type: Type.STRING, description: "Nome exato da categoria identificada" },
            description: { type: Type.STRING, description: "Descrição curta do gasto" },
            date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" }
          },
          required: ["amount", "description", "date"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    return JSON.parse(jsonText) as SmartParseResult;
  } catch (error) {
    console.error("Erro ao processar com Gemini:", error);
    return null;
  }
};