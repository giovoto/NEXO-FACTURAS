
'use server';

import { db, authAdmin } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { EmpresaRole } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export type UsuarioEmpresa = {
  uid: string;
  email: string;
  displayName?: string;
  rol: EmpresaRole;
};

// --- User Management Actions for a Company ---

export async function getUsuariosEmpresaAction(idToken: string, empresaId: string): Promise<UsuarioEmpresa[]> {
  await getAuthenticatedUser(idToken, empresaId, ['admin']);
  
  const empresaDoc = await db.collection('empresas').doc(empresaId).get();
  if (!empresaDoc.exists) {
    throw new Error('Empresa no encontrada.');
  }

  const usuariosMap = empresaDoc.data()?.usuarios || {};
  if (Object.keys(usuariosMap).length === 0) {
    return [];
  }

  const uids = Object.keys(usuariosMap);
  const userRecords = await authAdmin.getUsers(uids.map(uid => ({ uid })));

  return userRecords.users.map(user => ({
    uid: user.uid,
    email: user.email || 'N/A',
    displayName: user.displayName,
    rol: usuariosMap[user.uid],
  }));
}

export async function inviteUserAction(idToken: string, empresaId: string, email: string, rol: EmpresaRole): Promise<{ success: boolean; message: string; error?: boolean }> {
  await getAuthenticatedUser(idToken, empresaId, ['admin']);

  let userRecord;
  try {
    // 1. Find or create the user in Firebase Auth
    try {
      userRecord = await authAdmin.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await authAdmin.createUser({ email });
      } else {
        throw error;
      }
    }
    const uid = userRecord.uid;

    // 2. Add the company-role mapping to the user's document
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.set({
      empresas: { [empresaId]: rol }
    }, { merge: true });

    // 3. Add the user-role mapping to the company's document
    const empresaDocRef = db.collection('empresas').doc(empresaId);
    await empresaDocRef.set({
      usuarios: { [uid]: rol }
    }, { merge: true });
    
    revalidatePath(`/empresa/usuarios`);
    return { success: true, message: `El usuario ${email} ha sido añadido a la empresa.` };

  } catch (error: any) {
    console.error("Error inviting user:", error);
    return { success: false, message: error.message, error: true };
  }
}

export async function updateUserRoleAction(idToken: string, empresaId: string, uid: string, rol: EmpresaRole): Promise<{ success: true }> {
  const caller = await getAuthenticatedUser(idToken, empresaId, ['admin']);
  
  // Prevent admin from removing their own admin role if they are the last one
  const empresaDoc = await db.collection('empresas').doc(empresaId).get();
  const usuarios = empresaDoc.data()?.usuarios || {};
  if (caller.uid === uid && usuarios[uid] === 'admin') {
      const otherAdmins = Object.entries(usuarios).filter(([id, r]) => id !== uid && r === 'admin');
      if (otherAdmins.length === 0) {
          throw new Error('No puedes quitar tu propio rol de administrador si eres el único.');
      }
  }

  const batch = db.batch();
  batch.set(db.collection('users').doc(uid), { empresas: { [empresaId]: rol } }, { merge: true });
  batch.set(db.collection('empresas').doc(empresaId), { usuarios: { [uid]: rol } }, { merge: true });
  await batch.commit();
  
  revalidatePath(`/empresa/usuarios`);
  return { success: true };
}

export async function removeUserFromEmpresaAction(idToken: string, empresaId: string, uid: string): Promise<{ success: true }> {
  const caller = await getAuthenticatedUser(idToken, empresaId, ['admin']);

  if (caller.uid === uid) {
    throw new Error('No puedes eliminarte a ti mismo de la empresa.');
  }

  const batch = db.batch();
  const userDocRef = db.collection('users').doc(uid);
  batch.update(userDocRef, { [`empresas.${empresaId}`]: FieldValue.delete() });

  const empresaDocRef = db.collection('empresas').doc(empresaId);
  batch.update(empresaDocRef, { [`usuarios.${uid}`]: FieldValue.delete() });
  
  await batch.commit();

  revalidatePath(`/empresa/usuarios`);
  return { success: true };
}
