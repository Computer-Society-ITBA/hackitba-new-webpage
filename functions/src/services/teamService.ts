import admin from "firebase-admin";
import {getHackitbaDb} from "../helpers/getDb";
import * as logger from "firebase-functions/logger";

export interface TeamData {
    label: string;
    name: string;
    tell_why: string;
  category_1: number | null;
  category_2: number | null;
  category_3: number | null;
    category: number | null;
    is_finalista: boolean;
    link_deploy: string | null;
    link_github: string | null;
    status: string;
    is_created_by_admin: boolean;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}

export interface UpdateTeamData {
    name?: string;
    tell_why?: string;
  category_1?: number | null;
  category_2?: number | null;
  category_3?: number | null;
    category?: number | null;
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
  const db = getHackitbaDb();
  const teamDoc = await db
    .collection("teams")
    .doc(label)
    .get();

  return teamDoc.exists;
};

export const getUserById = async (userId: string) => {
  const db = getHackitbaDb();
  const userDoc = await db
    .collection("users")
    .doc(userId)
    .get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data();
};

export const createTeam = async (teamData: TeamData): Promise<string> => {
  const db = getHackitbaDb();
  await db.collection("teams").doc(teamData.label).set(teamData);
  logger.info(`Equipo creado: ${teamData.label}`);
  return teamData.label;
};

export const updateUserTeam = async (userId: string, teamLabel: string): Promise<void> => {
  const db = getHackitbaDb();
  await db.collection("users").doc(userId).update({
    team: teamLabel,
    hasTeam: true,
    wantsToCreateTeam: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  logger.info(`Usuario ${userId} actualizado con team: ${teamLabel}`);
};

export const getTeamByLabel = async (label: string) => {
  const db = getHackitbaDb();
  const teamDoc = await db
    .collection("teams")
    .doc(label)
    .get();

  if (!teamDoc.exists) {
    return null;
  }

  return {
    id: teamDoc.id,
    ref: teamDoc.ref,
    data: teamDoc.data(),
  };
};

export const getAllTeams = async () => {
  const db = getHackitbaDb();
  const teamsSnapshot = await db.collection("teams").get();

  return teamsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateTeam = async (
  teamRef: admin.firestore.DocumentReference,
  updates: UpdateTeamData
): Promise<void> => {
  const updatedData: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (updates.name) updatedData.name = updates.name.trim();
  if (updates.tell_why) updatedData.tell_why = updates.tell_why.trim();
  if (updates.category_1) updatedData.category_1 = updates.category_1;
  if (updates.category_2) updatedData.category_2 = updates.category_2;
  if (updates.category_3) updatedData.category_3 = updates.category_3;
  if (updates.category !== undefined) updatedData.category = updates.category;
  if (updates.status) updatedData.status = updates.status;

  await teamRef.update(updatedData);
};

export const getTeamMembers = async (teamLabel: string) => {
  const db = getHackitbaDb();
  const usersSnapshot = await db
    .collection("users")
    .where("team", "==", teamLabel)
    .get();

  return usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Eliminar miembros de equipo deshabilitado
