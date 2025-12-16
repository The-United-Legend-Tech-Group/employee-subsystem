const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

export interface CVAnalysisResult {
  sections?: any;
  completeness?: {
    contact?: number;
    summary?: number;
    experience?: number;
    education?: number;
    skills?: number;
    certifications?: number;
  };
  relevanceScore?: number;
  grammarIssues?: Array<{ text: string; suggestion: string }>;
  formattingIssues?: Array<{
    section: string;
    issue: string;
    suggestion: string;
  }>;
  suggestions?: string[];
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
}

export interface CVRecord {
  id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  score?: number;
  analysis?: CVAnalysisResult;
  candidateId?: string;
  applicationId?: string;
  uploadedBy: string;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

export interface UploadCVResponse {
  id: string;
  filename: string;
  status: string;
  uploadedBy: string;
  candidateId?: string;
  applicationId?: string;
  createdAt: string;
  message: string;
}

class ATSService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async uploadCV(
    file: File,
    uploadedBy: string,
    candidateId?: string,
    applicationId?: string,
    jobDescription?: string
  ): Promise<UploadCVResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (candidateId) formData.append("candidateId", candidateId);
    if (applicationId) formData.append("applicationId", applicationId);
    if (jobDescription) formData.append("jobDescription", jobDescription);

    const response = await fetch(
      `${API_URL}/recruitment/ats/upload?uploadedBy=${uploadedBy}`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "Failed to upload CV");
    }

    return response.json();
  }

  async getCVStatus(cvId: string): Promise<CVRecord> {
    const response = await fetch(`${API_URL}/recruitment/ats/${cvId}/status`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get CV status");
    }

    return response.json();
  }

  async getCVAnalysis(cvId: string): Promise<CVRecord> {
    const response = await fetch(
      `${API_URL}/recruitment/ats/${cvId}/analysis`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to get analysis" }));
      throw new Error(error.message || "Failed to get CV analysis");
    }

    return response.json();
  }

  async getAllCVs(limit = 50, skip = 0): Promise<CVRecord[]> {
    const response = await fetch(
      `${API_URL}/recruitment/ats?limit=${limit}&skip=${skip}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get CVs");
    }

    return response.json();
  }

  async getCVsByCandidate(candidateId: string): Promise<CVRecord[]> {
    const response = await fetch(
      `${API_URL}/recruitment/ats/candidate/${candidateId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get CVs by candidate");
    }

    return response.json();
  }

  async reanalyzeCV(cvId: string, jobDescription?: string): Promise<any> {
    const response = await fetch(
      `${API_URL}/recruitment/ats/${cvId}/reanalyze`,
      {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to reanalyze CV");
    }

    return response.json();
  }

  async deleteCV(cvId: string): Promise<void> {
    const response = await fetch(`${API_URL}/recruitment/ats/${cvId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete CV");
    }
  }
}

export const atsService = new ATSService();
