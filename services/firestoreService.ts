
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from '../lib/firebase';
import { QuestionnaireData, ComplianceTask } from '../types';

export const questionnaireService = {
  async save(uid: string, data: QuestionnaireData) {
    const docRef = doc(db, 'questionnaires', uid);
    await setDoc(docRef, data);
  },

  async get(uid: string): Promise<QuestionnaireData | null> {
    const docSnap = await getDoc(doc(db, 'questionnaires', uid));
    return docSnap.exists() ? docSnap.data() as QuestionnaireData : null;
  },

  subscribe(uid: string, callback: (data: QuestionnaireData | null) => void) {
    return onSnapshot(doc(db, 'questionnaires', uid), (doc) => {
      callback(doc.exists() ? doc.data() as QuestionnaireData : null);
    });
  }
};

export const tasksService = {
  async saveAll(uid: string, tasks: ComplianceTask[]) {
    const docRef = doc(db, 'tasks', uid);
    await setDoc(docRef, { items: tasks });
  },

  subscribe(uid: string, callback: (tasks: ComplianceTask[]) => void) {
    return onSnapshot(doc(db, 'tasks', uid), (doc) => {
      callback(doc.exists() ? (doc.data() as { items: ComplianceTask[] }).items : []);
    });
  }
};
