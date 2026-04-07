
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  addDoc,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from '../lib/firebase';
import { User, SupportTicket, AuditLog, Subscription, AccessLog } from '../types';

export const adminService = {
  // Usuários
  async getAllUsers() {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => d.data() as User);
    } catch (error: any) {
      console.error("AdminService.getAllUsers Error details:", error);
      throw error;
    }
  },

  async updateUserPlan(uid: string, plan: User['plan'], adminId: string, adminName: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { plan });
    await this.logAudit(adminId, adminName, 'Alteração de Plano', uid, `Plano alterado para ${plan}`);
  },

  async toggleUserStatus(uid: string, currentStatus: string, adminId: string, adminName: string) {
    const userRef = doc(db, 'users', uid);
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await updateDoc(userRef, { status: newStatus });
    await this.logAudit(adminId, adminName, 'Alteração de Status', uid, `Status alterado para ${newStatus}`);
  },

  async updateUserDetails(uid: string, data: Partial<User>, adminId: string, adminName: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
    await this.logAudit(adminId, adminName, 'Edição de Dados', uid, `Dados atualizados: ${Object.keys(data).join(', ')}`);
  },

  async deleteUser(uid: string, adminId: string, adminName: string) {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    try {
      await deleteDoc(doc(db, 'questionnaires', uid));
      await deleteDoc(doc(db, 'tasks', uid));
    } catch (e) {
      console.warn("Vínculos não encontrados para deleção.");
    }
    await this.logAudit(adminId, adminName, 'Exclusão de Conta', uid, `Usuário removido permanentemente do sistema`);
  },

  // Suporte
  subscribeToTickets(callback: (tickets: SupportTicket[]) => void) {
    const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket)));
    }, (error: any) => {
      console.error("AdminService.subscribeToTickets Error:", error);
    });
  },

  async updateTicketStatus(ticketId: string, status: SupportTicket['status']) {
    const ref = doc(db, 'support_tickets', ticketId);
    await updateDoc(ref, { status });
  },

  async updateTicketNotes(ticketId: string, internalNotes: string) {
    const ref = doc(db, 'support_tickets', ticketId);
    await updateDoc(ref, { internalNotes });
  },

  // Auditoria
  async logAudit(adminId: string, adminName: string, action: string, targetUserId: string, details: string) {
    await addDoc(collection(db, 'audit_logs'), {
      adminId,
      adminName,
      action,
      targetUserId,
      details,
      timestamp: new Date().toISOString()
    });
  },

  async getUserAccessLogs(uid: string): Promise<AccessLog[]> {
    try {
      const q = query(
        collection(db, 'access_logs'), 
        where('userId', '==', uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AccessLog));
    } catch (error) {
      console.error("Erro ao buscar logs de acesso:", error);
      return [];
    }
  },

  // Assinaturas
  async getSubscriptions() {
    try {
      const q = query(collection(db, 'subscriptions'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
    } catch (error: any) {
      console.error("AdminService.getSubscriptions Error:", error);
      return [];
    }
  }
};
