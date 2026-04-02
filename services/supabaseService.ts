import { supabase } from './supabase';
import { AnalysisResult } from '../types';

export const saveAudit = async (userId: string, businessName: string, geoScore: number, reportData: AnalysisResult, projectId?: string) => {
    try {
        // 1. Check if an audit already exists for this project
        // This is more reliable than 'upsert' with complex unique constraints
        if (projectId) {
            const { data: existing } = await supabase
                .from('audits')
                .select('id')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existing) {
                // 2a. Perform update if it exists
                const { data, error } = await supabase
                    .from('audits')
                    .update({
                        business_name: businessName,
                        geo_score: geoScore,
                        report_data: reportData,
                        user_id: userId
                    })
                    .eq('id', existing.id)
                    .select();
                
                if (error) throw error;
                return { success: true, data };
            }
        }

        // 2b. Perform insert if no project_id or no existing record
        const { data, error } = await supabase
            .from('audits')
            .insert([
                {
                    user_id: userId,
                    business_name: businessName,
                    geo_score: geoScore,
                    report_data: reportData,
                    project_id: projectId
                }
            ])
            .select();
        
        if (error) throw error;
        return { success: true, data };

    } catch (error) {
        console.error('CRITICAL: Error in saveAudit:', error);
        return { success: false, error };
    }
};

export const getUserAudits = async (userId: string) => {
    const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching audits:', error);
        return [];
    }
    return data;
};

// Project Management
export const createProject = async (userId: string, businessName: string, name: string = 'My Project', brandName?: string) => {
    const { data, error } = await supabase
        .from('projects')
        .insert([
            {
                user_id: userId,
                business_name: businessName,
                name: name,
                brand_name: brandName,
            }
        ])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating project:', error);
        return { success: false, error };
    }
    return { success: true, data };
};

export const getProjects = async (userId: string) => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
    return data || [];
};

export const updateProject = async (projectId: string, updates: { name?: string; brand_name?: string }) => {
    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating project:', error);
        return { success: false, error };
    }
    return { success: true, data };
};

export const deleteProject = async (projectId: string) => {
    // Relying on the database ON DELETE CASCADE for audits
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
        
    if (error) {
        console.error('Error deleting project:', error);
        return { success: false, error };
    }

    return { success: true };
};

/**
 * Gets the current usage from the user profile.
 * This also triggers the monthly reset logic in Postgres.
 */
export const getUserUsage = async (userId: string) => {
    // Calling the function we created in migration
    const { data, error } = await supabase.rpc('get_current_usage', { target_user_id: userId });
    
    if (error) {
        console.error('Error fetching usage:', error);
        return { audits_used: 0, simulations_used: 0 };
    }
    
    return data && data[0] ? data[0] : { audits_used: 0, simulations_used: 0 };
};

/**
 * Increments the user's audit consumption count.
 */
export const incrementAuditUsage = async (userId: string) => {
    const { error } = await supabase.rpc('increment_audits', { target_user_id: userId });
    if (error) {
        // Fallback: manual update if RPC fails
        const { data: profile } = await supabase.from('profiles').select('audits_consumed').eq('id', userId).single();
        await supabase.from('profiles').update({ audits_consumed: (profile?.audits_consumed || 0) + 1 }).eq('id', userId);
    }
};

/**
 * Increments the user's simulation consumption count.
 */
export const incrementSimulationUsage = async (userId: string) => {
    // Create the RPC if it doesn't exist, or just use manual update
    const { data: profile } = await supabase.from('profiles').select('simulations_consumed').eq('id', userId).single();
    await supabase.from('profiles').update({ simulations_consumed: (profile?.simulations_consumed || 0) + 1 }).eq('id', userId);
};

export const getTotalAuditCount = async (userId: string) => {
    const usage = await getUserUsage(userId);
    return usage.audits_used;
};

// Support Tickets
export const createSupportTicket = async (ticket: { user_id: string; user_email: string; subject: string; message: string }) => {
    const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticket])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating support ticket:', error);
        return { success: false, error };
    }
    return { success: true, data };
};
