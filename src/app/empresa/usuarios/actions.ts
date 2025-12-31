'use server';

import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { EmpresaRole } from '@/lib/types';

export type UsuarioEmpresa = {
  uid: string;
  email: string;
  displayName?: string;
  rol: EmpresaRole;
};

// ============================================
// USER MANAGEMENT FOR EMPRESAS
// ============================================

export async function getUsuariosEmpresaAction(empresaId: string): Promise<UsuarioEmpresa[]> {
  try {
    // Get all user_empresas relationships for this empresa
    const { data: userEmpresas, error } = await supabase
      .from('user_empresas')
      .select(`
        user_id,
        role,
        users (
          auth_id,
          email,
          display_name
        )
      `)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(`Error fetching empresa users: ${error.message}`);
    }

    if (!userEmpresas || userEmpresas.length === 0) {
      return [];
    }

    return userEmpresas.map(ue => ({
      uid: (ue.users as any).auth_id,
      email: (ue.users as any).email || 'N/A',
      displayName: (ue.users as any).display_name,
      rol: ue.role as EmpresaRole,
    }));
  } catch (error: any) {
    console.error('Error in getUsuariosEmpresaAction:', error);
    throw error;
  }
}

export async function inviteUserAction(
  empresaId: string,
  email: string,
  rol: EmpresaRole
): Promise<{ success: boolean; message: string; error?: boolean }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Find or create user in Supabase Auth
    let authUser;
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    authUser = existingUsers?.users.find(u => u.email === email);

    if (!authUser) {
      // Create new user with temporary password
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (error) {
        throw new Error(`Error creating user: ${error.message}`);
      }
      authUser = data.user;
    }

    // 2. Ensure user exists in public.users
    const { data: publicUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();

    let userId;
    if (userError || !publicUser) {
      // Create user in public.users if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          email: authUser.email,
          display_name: authUser.user_metadata?.display_name,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating public user: ${createError.message}`);
      }
      userId = newUser.id;
    } else {
      userId = publicUser.id;
    }

    // 3. Add user to empresa with role
    const { error: relationError } = await supabase
      .from('user_empresas')
      .insert({
        user_id: userId,
        empresa_id: empresaId,
        role: rol,
      });

    if (relationError) {
      // Check if already exists
      if (relationError.code === '23505') { // unique violation
        return { success: false, message: 'El usuario ya está en esta empresa.', error: true };
      }
      throw new Error(`Error adding user to empresa: ${relationError.message}`);
    }

    revalidatePath(`/empresa/usuarios`);
    return { success: true, message: `El usuario ${email} ha sido añadido a la empresa.` };
  } catch (error: any) {
    console.error('Error inviting user:', error);
    return { success: false, message: error.message, error: true };
  }
}

export async function updateUserRoleAction(
  empresaId: string,
  uid: string,
  rol: EmpresaRole
): Promise<{ success: true }> {
  try {
    // Get user_id from auth_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', uid)
      .single();

    if (userError || !user) {
      throw new Error('Usuario no encontrado');
    }

    // Prevent admin from removing their own admin role if they are the last one
    const { data: empresaUsers, error: usersError } = await supabase
      .from('user_empresas')
      .select('user_id, role')
      .eq('empresa_id', empresaId);

    if (usersError) {
      throw new Error(`Error fetching empresa users: ${usersError.message}`);
    }

    const currentUser = empresaUsers?.find(eu => eu.user_id === user.id);
    if (currentUser && currentUser.role === 'admin') {
      const otherAdmins = empresaUsers?.filter(eu => eu.user_id !== user.id && eu.role === 'admin');
      if (!otherAdmins || otherAdmins.length === 0) {
        throw new Error('No puedes quitar el rol de administrador si eres el único.');
      }
    }

    // Update role
    const { error: updateError } = await supabase
      .from('user_empresas')
      .update({ role: rol })
      .eq('user_id', user.id)
      .eq('empresa_id', empresaId);

    if (updateError) {
      throw new Error(`Error updating role: ${updateError.message}`);
    }

    revalidatePath(`/empresa/usuarios`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

export async function removeUserFromEmpresaAction(
  empresaId: string,
  uid: string
): Promise<{ success: true }> {
  try {
    // Get user_id from auth_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', uid)
      .single();

    if (userError || !user) {
      throw new Error('Usuario no encontrado');
    }

    // Delete relationship
    const { error } = await supabase
      .from('user_empresas')
      .delete()
      .eq('user_id', user.id)
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(`Error removing user from empresa: ${error.message}`);
    }

    revalidatePath(`/empresa/usuarios`);
    return { success: true };
  } catch (error: any) {
    console.error('Error removing user from empresa:', error);
    throw error;
  }
}
