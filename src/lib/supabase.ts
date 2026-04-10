import { createClient } from '@supabase/supabase-js';
import { supabaseKey } from './utils';

const supabaseUrl = 'https://wanzyvycqgcvkqtypnrj.supabase.co';
export const supabase = createClient(supabaseUrl, supabaseKey);