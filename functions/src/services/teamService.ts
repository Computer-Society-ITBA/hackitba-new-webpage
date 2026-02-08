import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

export interface TeamData {
    label: string;
    name: string;
    tell_why: string;
    category_1: number;
    category_2: number;
    category_3: number;
    category: null;
    admin_id: string;
    is_finalista: boolean;
    link_deploy: string | null;
    link_github: string | null;
    status: string;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}

export interface UpdateTeamData {
    name?: string;
    tell_why?: string;
    category_1?: number;
    category_2?: number;
    category_3?: number;
    status?: string;
}

// Función para crear un label único a partir del nombre
export const createLabel = (name: string): string => {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
};

export const teamExists = async (label: string): Promise<boolean> => {
    const teamDoc = await admin
        .firestore()
        .collection("teams")
        .doc(label)
        .get();
    
    return teamDoc.exists;
};

export const getUserById = async (userId: string) => {
    const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
    
    if (!userDoc.exists) {
        return null;
    }
    
    return userDoc.data();
};

export const createTeam = async (teamData: TeamData): Promise<string> => {
    await admin.firestore().collection("teams").doc(teamData.label).set(teamData);
    logger.info(`Equipo creado: ${teamData.label} por usuario: ${teamData.admin_id}`);
    return teamData.label;
};

export const updateUserTeam = async (userId: string, teamLabel: string): Promise<void> => {
    await admin.firestore().collection("users").doc(userId).update({
        team: teamLabel,
        hasTeam: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(`Usuario ${userId} actualizado con team: ${teamLabel}`);
};

export const getTeamByLabel = async (label: string) => {
    const teamDoc = await admin
        .firestore()
        .collection("teams")
        .doc(label)
        .get();
    
    if (!teamDoc.exists) {
        return null;
    }
    
    return {
        id: teamDoc.id,
        ref: teamDoc.ref,
        data: teamDoc.data()
    };
};

export const getAllTeams = async () => {
    const teamsSnapshot = await admin.firestore().collection("teams").get();
    
    return teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const updateTeam = async (
    teamRef: admin.firestore.DocumentReference,
    updates: UpdateTeamData
): Promise<void> => {
    const updatedData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (updates.name) updatedData.name = updates.name.trim();
    if (updates.tell_why) updatedData.tell_why = updates.tell_why.trim();
    if (updates.category_1) updatedData.category_1 = updates.category_1;
    if (updates.category_2) updatedData.category_2 = updates.category_2;
    if (updates.category_3) updatedData.category_3 = updates.category_3;
    if (updates.status) updatedData.status = updates.status;

    await teamRef.update(updatedData);
};

export const getTeamMembers = async (teamLabel: string) => {
    const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("team", "==", teamLabel)
        .get();
    
    return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const removeMemberFromTeam = async (userId: string): Promise<void> => {
    await admin.firestore().collection("users").doc(userId).update({
        team: null,
        hasTeam: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};
