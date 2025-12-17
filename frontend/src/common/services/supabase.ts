import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zgecjrwvzirlnuafpxez.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZWNqcnd2emlybG51YWZweGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzQ4ODQsImV4cCI6MjA2NjU1MDg4NH0.Wr0mQ6KjHQ7duZ8u0pVo455SxVOkKUoZFlwg5qFDDCw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
