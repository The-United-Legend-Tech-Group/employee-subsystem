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
}

export const apiService = new ApiService() 