import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

export class AIService {
  async generateMatchAnalysis(matchDetails: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Réponds UNIQUEMENT en français avec l'analyse direct. Ne montre aucun texte d'introduction ou d'intention. En tant qu'expert en paris sportifs pour Flash w, analyse le match suivant : \n\n${matchDetails}`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });

      return response.text || "Aucune analyse disponible.";
    } catch (error: any) {
      console.error("Erreur Google AI Studio :", error);
      throw new Error(`Erreur API: ${error.message}`);
    }
  }
}

export const aiService = new AIService();
