import { supabase } from './supabase'

class ApiService {
  async uploadFile(file: File, userId: string) {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
  
      // Upload the file to Supabase
      const { error } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);
  
      if (error) throw error;
  
      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
  
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload resume error:', error);
      throw error;
    }
  }

  /**
   * Given a stored file path, return a public URL using Supabase.
   * If the path is already an absolute URL, it is returned as-is.
   */
  async getPublicFileUrl(path: string): Promise<string> {
    if (!path) {
      throw new Error('Empty file path');
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const { data } = supabase.storage.from('resumes').getPublicUrl(path);
    return data.publicUrl;
  }
}

export const apiService = new ApiService() 