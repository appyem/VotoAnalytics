import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  QueryConstraint,
  writeBatch} from "firebase/firestore";
import { db } from "../firebase";
import type { Project, VoteRecord } from "../models/types";

// ============================================================================
// CONSTANTES DE COLECCIONES
// ============================================================================

const COLLECTIONS = {
  PROJECTS: "projects",
  VOTES: "votes",
  PARTIES: "parties",
  CANDIDATES: "candidates",
  LEADERS: "leaders"
} as const;

// ============================================================================
// FUNCIONES PARA PROJECTS
// ============================================================================

export const getProjects = async (): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PROJECTS),
      orderBy("year", "desc")
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
    
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("No se pudieron cargar los proyectos electorales");
  }
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Project;
    
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    throw new Error(`No se pudo cargar el proyecto`);
  }
};

export const createProject = async (projectData: Omit<Project, "id" | "createdAt">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
      ...projectData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error("No se pudo crear el proyecto");
  }
};

// ============================================================================
// FUNCIONES PARA VOTES
// ============================================================================

export const getVotesByProject = async (projectId: string): Promise<VoteRecord[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.VOTES),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VoteRecord[];
    
  } catch (error) {
    console.error(`Error fetching votes for project ${projectId}:`, error);
    throw new Error("No se pudieron cargar los registros de votación");
  }
};

export const getVotesFiltered = async (
  projectId: string, 
  filters?: {
    department?: string;
    municipality?: string;
    partyId?: string;
    candidateId?: string;
  }
): Promise<VoteRecord[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where("projectId", "==", projectId)
    ];
    
    if (filters?.department) {
      constraints.push(where("department", "==", filters.department));
    }
    if (filters?.municipality) {
      constraints.push(where("municipality", "==", filters.municipality));
    }
    if (filters?.partyId) {
      constraints.push(where("partyId", "==", filters.partyId));
    }
    if (filters?.candidateId) {
      constraints.push(where("candidateId", "==", filters.candidateId));
    }
    
    const q = query(
      collection(db, COLLECTIONS.VOTES),
      ...constraints,
      orderBy("createdAt", "desc"),
      limit(1000)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VoteRecord[];
    
  } catch (error) {
    console.error("Error fetching filtered votes:", error);
    throw new Error("No se pudieron aplicar los filtros de votación");
  }
};

export const saveVote = async (voteData: Omit<VoteRecord, "id">): Promise<string> => {
  try {
    const requiredFields: Array<keyof typeof voteData> = [
      "projectId", "department", "municipality", "puesto", "mesa", 
      "partyId", "candidateId", "votes"
    ];
    
    for (const field of requiredFields) {
      const value = voteData[field];
      if (value === undefined || value === null || value === "") {
        throw new Error(`Campo requerido faltante o vacío: ${field}`);
      }
    }
    
    const duplicateCheck = await getVotesFiltered(voteData.projectId, {
      department: voteData.department,
      municipality: voteData.municipality,
      partyId: voteData.partyId,
      candidateId: voteData.candidateId
    });
    
    const isDuplicate = duplicateCheck.some(
      v => v.mesa === voteData.mesa && v.puesto === voteData.puesto
    );
    
    if (isDuplicate) {
      throw new Error("Ya existe un registro para esta mesa, puesto, partido y candidato");
    }
    
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTIONS.VOTES), {
      ...voteData,
      createdAt: now,
      updatedAt: now
    });
    
    return docRef.id;
    
  } catch (error) {
    console.error("Error saving vote:", error);
    if (error instanceof Error) throw error;
    throw new Error("No se pudo guardar el registro de votación");
  }
};

export const updateVote = async (voteId: string, updates: Partial<VoteRecord>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTES, voteId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error updating vote ${voteId}:`, error);
    throw new Error("No se pudo actualizar el registro");
  }
};

export const deleteVote = async (voteId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.VOTES, voteId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting vote ${voteId}:`, error);
    throw new Error("No se pudo eliminar el registro");
  }
};

// ============================================================================
// FUNCIONES DE CARGA MASIVA (NUEVO - PASO 6.1)
// ============================================================================

/**
 * Resultado de una carga masiva de votos
 */
export interface BatchUploadResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ index: number; message: string; row: Partial<VoteRecord> }>;
  duration: number;
}

/**
 * Guarda múltiples votos en Firestore usando writeBatch (máximo 500 por lote)
 * Incluye validación de duplicados y callback de progreso
 */
export const saveVotesBatch = async (
  votes: Omit<VoteRecord, "id">[],
  projectId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<BatchUploadResult> => {
  const startTime = Date.now();
  const result: BatchUploadResult = {
    successCount: 0,
    errorCount: 0,
    errors: [],
    duration: 0
  };

  try {
    // Validación inicial de todos los registros
    const validatedVotes: Array<Omit<VoteRecord, "id"> & { _originalIndex: number }> = [];
    
    for (let i = 0; i < votes.length; i++) {
      const vote = votes[i];
      
      // Validar campos requeridos
      const requiredFields: Array<keyof typeof vote> = [
        "projectId", "department", "municipality", "puesto", "mesa", 
        "partyId", "candidateId", "votes"
      ];
      
      let isValid = true;
      for (const field of requiredFields) {
        const value = vote[field];
        if (value === undefined || value === null || value === "") {
          result.errors.push({ 
            index: i, 
            message: `Campo requerido faltante: ${field}`, 
            row: vote 
          });
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        validatedVotes.push({ ...vote, _originalIndex: i });
      } else {
        result.errorCount++;
      }
      
      // Callback de progreso durante validación
      if (onProgress) {
        onProgress(i + 1, votes.length + 100); // +100 para diferenciar fase de validación
      }
    }

    // Si no hay votos válidos, retornar temprano
    if (validatedVotes.length === 0) {
      result.duration = Date.now() - startTime;
      return result;
    }

    // Obtener votos existentes para validación de duplicados (optimizado)
    const existingVotes = await getVotesByProject(projectId);
    const existingKeys = new Set(
      existingVotes.map(v => `${v.mesa}|${v.puesto}|${v.partyId}|${v.candidateId}`)
    );

    // Dividir en lotes de 500 (límite de Firestore)
    const BATCH_SIZE = 500;
    const batches: Array<typeof validatedVotes> = [];
    
    for (let i = 0; i < validatedVotes.length; i += BATCH_SIZE) {
      batches.push(validatedVotes.slice(i, i + BATCH_SIZE));
    }

    // Procesar cada lote
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = writeBatch(db);
      const currentBatch = batches[batchIndex];
      
      for (const vote of currentBatch) {
        // Verificar duplicados
        const key = `${vote.mesa}|${vote.puesto}|${vote.partyId}|${vote.candidateId}`;
        
        if (existingKeys.has(key)) {
          result.errors.push({
            index: vote._originalIndex,
            message: "Registro duplicado: misma mesa, puesto, partido y candidato",
            row: vote
          });
          result.errorCount++;
          continue;
        }
        
        // Preparar documento para guardar
        const now = new Date().toISOString();
        const docRef = doc(collection(db, COLLECTIONS.VOTES));
        
        batch.set(docRef, {
          department: vote.department,
          municipality: vote.municipality,
          corregimiento: vote.corregimiento,
          puesto: vote.puesto,
          mesa: vote.mesa,
          partyId: vote.partyId,
          partyName: vote.partyName,
          candidateId: vote.candidateId,
          candidateName: vote.candidateName,
          leaderIds: vote.leaderIds,
          votes: vote.votes,
          projectId: vote.projectId,
          createdAt: now,
          updatedAt: now
        });
        
        // Marcar como procesado para evitar duplicados en este mismo batch
        existingKeys.add(key);
      }
      
      // Commit del batch
      await batch.commit();
      result.successCount += currentBatch.length - result.errors.filter(e => 
        currentBatch.some(v => v._originalIndex === e.index)
      ).length;
      
      // Callback de progreso durante guardado
      if (onProgress) {
        const processed = votes.length + ((batchIndex + 1) * BATCH_SIZE);
        onProgress(Math.min(processed, votes.length + 100), votes.length + 100);
      }
    }
    
    // Recalcular counts finales
    result.errorCount = result.errors.length;
    result.successCount = validatedVotes.length - result.errors.filter(e => 
      validatedVotes.some(v => v._originalIndex === e.index)
    ).length;
    
  } catch (error) {
    console.error("Error in batch upload:", error);
    if (error instanceof Error) {
      result.errors.push({ index: -1, message: error.message, row: {} });
    }
    result.errorCount++;
  }
  
  result.duration = Date.now() - startTime;
  return result;
};

// ============================================================================
// UTILIDADES DE CONSULTA
// ============================================================================

export const getProjectStats = async (projectId: string): Promise<{
  totalVotes: number;
  totalMesas: number;
  totalParties: number;
  lastUpdated: string | null;
}> => {
  try {
    const votes = await getVotesByProject(projectId);
    
    const totalVotes = votes.reduce((sum, v) => sum + v.votes, 0);
    const totalMesas = new Set(votes.map(v => v.mesa)).size;
    const totalParties = new Set(votes.map(v => v.partyId)).size;
    
    const votesWithDate = votes.filter(v => v.updatedAt || v.createdAt);
    const lastUpdated = votesWithDate.length > 0 
      ? votesWithDate.sort((a, b) => {
          const dateA = a.updatedAt || a.createdAt || "";
          const dateB = b.updatedAt || b.createdAt || "";
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })[0].updatedAt || votesWithDate[0].createdAt || null
      : null;
    
    return { totalVotes, totalMesas, totalParties, lastUpdated };
    
  } catch (error) {
    console.error("Error calculating project stats:", error);
    throw new Error("No se pudieron calcular las estadísticas");
  }
};



// ============================================================================
// FUNCIONES PARA AUTOCOMPLETADO PERSISTENTE (NUEVO)
// ============================================================================

/**
 * Obtiene mappings únicos de partido/candidato para autocompletado persistente
 * Query optimizado: solo trae campos necesarios, sin descargar votos completos
 */
export const getPartyCandidateReference = async (
  projectId: string
): Promise<{
  parties: Record<string, string>; // { [partyId]: partyName }
  candidates: Record<string, string>; // { [`${partyId}_${candidateId}`]: candidateName }
}> => {
  try {
    // Query optimizado: solo campos necesarios + limit para rendimiento
    const q = query(
      collection(db, COLLECTIONS.VOTES),
      where("projectId", "==", projectId),
      // Nota: Para usar select() necesitaría Firestore en modo nativo
      // Por ahora traemos docs completos pero con limit razonable
      limit(2000) // Ajustar según volumen esperado de partidos/candidatos únicos
    );
    
    const snapshot = await getDocs(q);
    
    const parties: Record<string, string> = {};
    const candidates: Record<string, string> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data() as Partial<VoteRecord>;
      
      // Guardar mapping de partido (si existe y no está ya)
      if (data.partyId?.trim() && data.partyName?.trim() && !parties[data.partyId]) {
        parties[data.partyId] = data.partyName.toUpperCase();
      }
      
      // Guardar mapping compuesto de candidato (si existe y no está ya)
      if (data.partyId?.trim() && data.candidateId?.trim() && data.candidateName?.trim()) {
        const key = `${data.partyId}_${data.candidateId}`;
        if (!candidates[key]) {
          candidates[key] = data.candidateName.toUpperCase();
        }
      }
    });
    
    return { parties, candidates };
    
  } catch (error) {
    console.error(`Error fetching reference data for project ${projectId}:`, error);
    // Retornar vacío en lugar de fallar: el formulario sigue funcionando sin autocompletado
    return { parties: {}, candidates: {} };
  }
};


// ============================================================================
// FUNCIONES PARA GESTIÓN DE REGISTROS (EDITAR/ELIMINAR POR PUESTO)
// ============================================================================

/**
 * Busca votos por coincidencia parcial en el campo 'puesto' (insensible a mayúsculas)
 */
export const getVotesByPuestoSearch = async (
  projectId: string,
  searchQuery: string
): Promise<VoteRecord[]> => {
  try {
    // Traemos todos los votos del proyecto y filtramos en cliente para búsqueda parcial
    // Nota: Firestore no soporta "contains" nativo en strings; para producción masiva considerar Algolia/Typesense
    const allVotes = await getVotesByProject(projectId);
    
    const queryLower = searchQuery.toLowerCase().trim();
    return allVotes.filter(v => 
      v.puesto?.toLowerCase().includes(queryLower)
    );
    
  } catch (error) {
    console.error(`Error searching votes by puesto "${searchQuery}":`, error);
    throw new Error("No se pudieron buscar los registros por puesto");
  }
};

/**
 * Actualiza el campo 'puesto' (y opcionalmente 'corregimiento') en múltiples votos
 * @param voteIds - Array de IDs de documentos a actualizar
 * @param newPuesto - Nuevo valor para el campo puesto
 * @param newCorregimiento - Nuevo valor para corregimiento (opcional, si también se corrige)
 */
export const updateVotesPuesto = async (
  voteIds: string[],
  newPuesto: string,
  newCorregimiento?: string
): Promise<{ successCount: number; errorCount: number }> => {
  const result = { successCount: 0, errorCount: 0 };
  
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    
    for (const voteId of voteIds) {
      const docRef = doc(db, COLLECTIONS.VOTES, voteId);
      const updates: Partial<VoteRecord> = {
        puesto: newPuesto.trim().toUpperCase(),
        updatedAt: now
      };
      
      if (newCorregimiento !== undefined) {
        updates.corregimiento = newCorregimiento.trim().toUpperCase();
      }
      
      batch.update(docRef, updates);
    }
    
    await batch.commit();
    result.successCount = voteIds.length;
    
  } catch (error) {
    console.error("Error updating votes puesto:", error);
    result.errorCount = voteIds.length;
    throw new Error("No se pudieron actualizar los registros");
  }
  
  return result;
};

/**
 * Elimina múltiples votos por sus IDs (con validación de seguridad)
 */
export const deleteVotesByIds = async (
  voteIds: string[]
): Promise<{ successCount: number; errorCount: number }> => {
  const result = { successCount: 0, errorCount: 0 };
  
  try {
    // Firestore batch delete limit: 500 operations per batch
    const BATCH_SIZE = 500;
    
    for (let i = 0; i < voteIds.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const currentBatch = voteIds.slice(i, i + BATCH_SIZE);
      
      for (const voteId of currentBatch) {
        const docRef = doc(db, COLLECTIONS.VOTES, voteId);
        batch.delete(docRef);
      }
      
      await batch.commit();
      result.successCount += currentBatch.length;
    }
    
  } catch (error) {
    console.error("Error deleting votes:", error);
    result.errorCount = voteIds.length;
    throw new Error("No se pudieron eliminar los registros");
  }
  
  return result;
};


// ============================================================================
// FUNCIONES PARA RANKINGS PROFESIONALES (NUEVO)
// ============================================================================

/**
 * Obtiene rankings agregados por múltiples dimensiones para análisis estratégico
 */
export const getStrategicRankings = async (
  projectId: string
): Promise<{
  topCandidates: Array<{ name: string; votes: number; party: string }>;
  topParties: Array<{ name: string; votes: number }>;
  topPuestos: Array<{ name: string; votes: number; municipality: string; corregimiento?: string }>;
  topMesas: Array<{ mesa: string; puesto: string; votes: number; party: string; candidate: string }>;
  byCorregimiento: Record<string, { totalVotes: number; topParty: string; topCandidate: string }>;
}> => {
  try {
    const allVotes = await getVotesByProject(projectId);
    
    // 1. Top Candidatos
    const candidateMap = new Map<string, { votes: number; party: string }>();
    allVotes.forEach(v => {
      if (v.candidateName?.trim()) {
        const key = v.candidateName.toUpperCase();
        const existing = candidateMap.get(key) || { votes: 0, party: v.partyName || "" };
        candidateMap.set(key, { 
          votes: existing.votes + v.votes, 
          party: existing.party || v.partyName || "" 
        });
      }
    });
    const topCandidates = Array.from(candidateMap.entries())
      .map(([name, data]) => ({ name, votes: data.votes, party: data.party }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
    
    // 2. Top Partidos
    const partyMap = new Map<string, number>();
    allVotes.forEach(v => {
      if (v.partyName?.trim()) {
        const key = v.partyName.toUpperCase();
        partyMap.set(key, (partyMap.get(key) || 0) + v.votes);
      }
    });
    const topParties = Array.from(partyMap.entries())
      .map(([name, votes]) => ({ name, votes }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
    
    // 3. Top Puestos de Votación
    const puestoMap = new Map<string, { votes: number; municipality: string; corregimiento?: string }>();
    allVotes.forEach(v => {
      if (v.puesto?.trim()) {
        const key = v.puesto.toUpperCase();
        const existing = puestoMap.get(key) || { votes: 0, municipality: v.municipality || "", corregimiento: v.corregimiento };
        puestoMap.set(key, { 
          votes: existing.votes + v.votes, 
          municipality: existing.municipality, 
          corregimiento: existing.corregimiento 
        });
      }
    });
    const topPuestos = Array.from(puestoMap.entries())
      .map(([name, data]) => ({ name, votes: data.votes, municipality: data.municipality, corregimiento: data.corregimiento }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
    
    // 4. Top Mesas (por votación individual)
    const topMesas = [...allVotes]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5)
      .map(v => ({
        mesa: v.mesa,
        puesto: v.puesto,
        votes: v.votes,
        party: v.partyName || "",
        candidate: v.candidateName || ""
      }));
    
    // 5. Agrupación por Corregimiento (inteligencia territorial)
    const corregimientoMap = new Map<string, { totalVotes: number; parties: Map<string, number>; candidates: Map<string, number> }>();
    allVotes.forEach(v => {
      // Usar corregimiento si existe, sino municipio como fallback
      const territorialKey = (v.corregimiento?.trim() || v.municipality)?.toUpperCase() || "SIN UBICACIÓN";
      
      const existing = corregimientoMap.get(territorialKey) || { 
        totalVotes: 0, 
        parties: new Map<string, number>(), 
        candidates: new Map<string, number>() 
      };
      
      existing.totalVotes += v.votes;
      if (v.partyName?.trim()) {
        const pKey = v.partyName.toUpperCase();
        existing.parties.set(pKey, (existing.parties.get(pKey) || 0) + v.votes);
      }
      if (v.candidateName?.trim()) {
        const cKey = v.candidateName.toUpperCase();
        existing.candidates.set(cKey, (existing.candidates.get(cKey) || 0) + v.votes);
      }
      
      corregimientoMap.set(territorialKey, existing);
    });
    
    const byCorregimiento: Record<string, { totalVotes: number; topParty: string; topCandidate: string }> = {};
    corregimientoMap.forEach((data, key) => {
      const topParty = Array.from(data.parties.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      const topCandidate = Array.from(data.candidates.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      byCorregimiento[key] = { totalVotes: data.totalVotes, topParty, topCandidate };
    });
    
    return { topCandidates, topParties, topPuestos, topMesas, byCorregimiento };
    
  } catch (error) {
    console.error("Error calculating strategic rankings:", error);
    throw new Error("No se pudieron generar los rankings estratégicos");
  }
};

/**
 * Obtiene votos filtrados por territorio jerárquico (incluye corregimientos)
 */
export const getVotesByTerritory = async (
  projectId: string,
  territoryFilter: {
    municipality?: string;
    corregimiento?: string;  // NUEVO: filtro específico para corregimientos
    puesto?: string;
  }
): Promise<VoteRecord[]> => {
  try {
    const allVotes = await getVotesByProject(projectId);
    
    return allVotes.filter(v => {
      if (territoryFilter.municipality && v.municipality?.toUpperCase() !== territoryFilter.municipality.toUpperCase()) {
        return false;
      }
      // NUEVO: Filtro por corregimiento (si se especifica, debe coincidir exactamente)
      if (territoryFilter.corregimiento) {
        const filterCorr = territoryFilter.corregimiento.toUpperCase().trim();
        const voteCorr = (v.corregimiento || "").toUpperCase().trim();
        if (filterCorr && voteCorr !== filterCorr) {
          return false;
        }
      }
      if (territoryFilter.puesto && v.puesto?.toUpperCase() !== territoryFilter.puesto.toUpperCase()) {
        return false;
      }
      return true;
    });
    
  } catch (error) {
    console.error("Error filtering by territory:", error);
    throw new Error("No se pudieron filtrar los votos por territorio");
  }
};