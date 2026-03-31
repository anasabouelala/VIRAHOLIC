import { supabase } from './supabase';
import { AnalysisResult } from '../types';

export const saveAudit = async (userId: string, businessName: string, geoScore: number, reportData: AnalysisResult, projectId?: string) => {
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
        ]);
    
    if (error) {
        console.error('Error saving audit:', error);
        return { success: false, error };
    }
    return { success: true, data };
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
    return data;
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
    // 1. Delete associated audits first to prevent foreign key constraint violation
    const { error: auditError } = await supabase
        .from('audits')
        .delete()
        .eq('project_id', projectId);
        
    if (auditError) {
        console.error('Error deleting project audits:', auditError);
        return { success: false, error: auditError };
    }

    // 2. Delete the project itself
    const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
    
    if (projectError) {
        console.error('Error deleting project:', projectError);
        return { success: false, error: projectError };
    }
    return { success: true };
};
