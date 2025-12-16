import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CVAnalysisResult } from '../models/cv-record.schema';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Try gemini-pro as it's more widely available
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.logger.log('Initialized Gemini service with model: gemini-pro');
  }

  async analyzeCV(
    cvText: string,
    jobDescription?: string,
  ): Promise<CVAnalysisResult> {
    try {
      if (!cvText || cvText.trim().length < 50) {
        throw new Error('CV text is too short for meaningful analysis (minimum 50 characters)');
      }

      const prompt = this.buildAnalysisPrompt(cvText, jobDescription);

      this.logger.log(`Sending CV to Gemini for analysis... (${cvText.length} chars)`);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.logger.log(`Received response from Gemini (${text.length} chars)`);
      this.logger.debug(`Gemini response preview: ${text.substring(0, 200)}...`);

      // Parse the JSON response
      const analysis = this.parseGeminiResponse(text);

      if (!analysis.overallScore) {
        this.logger.warn('Gemini did not return an overall score, using fallback');
        analysis.overallScore = 50;
      }

      return analysis;
    } catch (error) {
      this.logger.error('Error analyzing CV with Gemini:', error);
      this.logger.error('Error details:', error.message, error.stack);
      
      // Check for specific error types
      if (error.message?.includes('API key')) {
        throw new Error('Google Gemini API key is invalid or expired. Please check your API configuration.');
      } else if (error.message?.includes('quota')) {
        throw new Error('Google Gemini API quota exceeded. Please try again later.');
      } else if (error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
        throw new Error('Network error: Unable to reach Google Gemini API. Please check your internet connection.');
      }
      
      throw new Error(`Gemini analysis failed: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(cvText: string, jobDescription?: string): string {
    const basePrompt = `
You are an expert CV/Resume analyzer. Analyze the following CV and provide a structured JSON response.

**IMPORTANT**: Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text.

Analyze these aspects:
1. **Sections Detection**: Identify contact info, summary/objective, experience, education, skills, certifications
2. **Completeness Score**: Rate each section from 0.0 to 1.0 (0=missing, 1=excellent)
3. **Relevance Score**: Overall relevance from 0 to 100${jobDescription ? ' based on the job description provided' : ''}
4. **Grammar Issues**: Identify spelling/grammar problems with suggestions
5. **Formatting Issues**: Identify layout, structure, or readability problems
6. **Suggestions**: Provide 5-10 actionable improvements
7. **Strengths**: List 3-5 strong points
8. **Weaknesses**: List 3-5 areas needing improvement
9. **Overall Score**: Calculate weighted score (0-100) based on:
   - Completeness: 30%
   - Relevance: 30%
   - Grammar/Readability: 20%
   - Formatting/ATS-friendliness: 20%

**Required JSON Schema:**
\`\`\`json
{
  "sections": {
    "contact": { "present": boolean, "details": string },
    "summary": string,
    "experience": [{ "title": string, "company": string, "duration": string, "highlights": string[] }],
    "education": [{ "degree": string, "institution": string, "year": string }],
    "skills": string[],
    "certifications": [{ "name": string, "issuer": string, "year": string }]
  },
  "completeness": {
    "contact": number,
    "summary": number,
    "experience": number,
    "education": number,
    "skills": number,
    "certifications": number
  },
  "relevanceScore": number,
  "grammarIssues": [{ "text": string, "suggestion": string }],
  "formattingIssues": [{ "section": string, "issue": string, "suggestion": string }],
  "suggestions": string[],
  "strengths": string[],
  "weaknesses": string[],
  "overallScore": number
}
\`\`\`

${jobDescription ? `**Job Description:**\n${jobDescription}\n\n` : ''}

**CV Text:**
${cvText}

Return ONLY the JSON object, nothing else.
`;

    return basePrompt;
  }

  private parseGeminiResponse(text: string): CVAnalysisResult {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(cleanText);

      // Validate and normalize the response
      return {
        sections: parsed.sections || {},
        completeness: parsed.completeness || {},
        relevanceScore: parsed.relevanceScore || 0,
        grammarIssues: parsed.grammarIssues || [],
        formattingIssues: parsed.formattingIssues || [],
        suggestions: parsed.suggestions || [],
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        overallScore: parsed.overallScore || 0,
      };
    } catch (error) {
      this.logger.error('Failed to parse Gemini response:', error);
      this.logger.debug('Raw response:', text);

      // Return a fallback response
      return {
        overallScore: 50,
        relevanceScore: 50,
        suggestions: ['Analysis failed. Please try again or contact support.'],
        strengths: [],
        weaknesses: ['Unable to complete full analysis'],
        sections: {},
        completeness: {},
        grammarIssues: [],
        formattingIssues: [],
      };
    }
  }
}
