import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type DocumentType = "recto" | "verso" | "selfie" | "passport";

interface DocumentState {
  file: File | null;
  preview: string | null;
  status: "idle" | "captured" | "uploading" | "uploaded" | "error";
  errorMessage?: string;
}

const CIN_STEPS: DocumentType[] = ["recto", "verso", "selfie"];
const PASSPORT_STEPS: DocumentType[] = ["passport", "selfie"];

export function useMobileUpload() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [documentMode, setDocumentMode] = useState<"cin" | "passport">("cin");
  const [steps, setSteps] = useState<DocumentType[]>([...CIN_STEPS]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allUploaded, setAllUploaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animState, setAnimState] = useState<"idle" | "exit" | "enter">("idle");
  const [animDirection, setAnimDirection] = useState<"forward" | "backward">(
    "forward",
  );
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null);

  const fileInputRefs = {
    recto: useRef<HTMLInputElement>(null),
    verso: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null),
    passport: useRef<HTMLInputElement>(null),
  };

  // 👇 DÉFINIR getInitialDocuments AVANT de l'utiliser
  const getInitialDocuments = useCallback((): Record<
    DocumentType,
    DocumentState
  > => {
    if (documentMode === "passport") {
      return {
        passport: { file: null, preview: null, status: "idle" },
        selfie: { file: null, preview: null, status: "idle" },
        recto: { file: null, preview: null, status: "idle" },
        verso: { file: null, preview: null, status: "idle" },
      };
    }
    return {
      recto: { file: null, preview: null, status: "idle" },
      verso: { file: null, preview: null, status: "idle" },
      selfie: { file: null, preview: null, status: "idle" },
      passport: { file: null, preview: null, status: "idle" },
    };
  }, [documentMode]);

  // 👇 INITIALISER documents avec getInitialDocuments
  const [documents, setDocuments] = useState<
    Record<DocumentType, DocumentState>
  >(getInitialDocuments());

  // Récupérer la session
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/mobile-upload/session?sessionId=${sessionId}`,
      );
      const data = await res.json();
      const mode = data.documentType || "cin";
      setDocumentMode(mode);
      setSteps(mode === "passport" ? [...PASSPORT_STEPS] : [...CIN_STEPS]);
      setDocuments(getInitialDocuments());
      setCurrentStepIndex(0);
    } catch (error) {
      console.error("Erreur récupération session:", error);
    }
  }, [sessionId, getInitialDocuments]);

  // Navigation entre étapes
  const goToStep = useCallback(
    (nextIndex: number) => {
      if (
        nextIndex < 0 ||
        nextIndex >= steps.length ||
        nextIndex === currentStepIndex ||
        animState !== "idle"
      )
        return;

      const dir = nextIndex > currentStepIndex ? "forward" : "backward";
      setAnimDirection(dir);
      setPendingStepIndex(nextIndex);
      setAnimState("exit");

      setTimeout(() => {
        setCurrentStepIndex(nextIndex);
        setAnimState("enter");
        setTimeout(() => {
          setAnimState("idle");
          setPendingStepIndex(null);
        }, 350);
      }, 280);
    },
    [currentStepIndex, animState, steps.length],
  );

  const goNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) goToStep(currentStepIndex + 1);
  }, [currentStepIndex, goToStep, steps.length]);

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) goToStep(currentStepIndex - 1);
  }, [currentStepIndex, goToStep]);

  // Capture de photo
  const handleCapture = useCallback(
    (type: DocumentType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setDocuments((prev) => ({
          ...prev,
          [type]: {
            file,
            preview: reader.result as string,
            status: "captured",
          },
        }));
        const stepIndex = steps.indexOf(type);
        if (stepIndex < steps.length - 1) {
          setTimeout(() => goToStep(stepIndex + 1), 800);
        }
      };
      reader.readAsDataURL(file);
      if (fileInputRefs[type]?.current) fileInputRefs[type].current!.value = "";
    },
    [goToStep, steps],
  );

  const handleRemove = useCallback((type: DocumentType) => {
    setDocuments((prev) => ({
      ...prev,
      [type]: { file: null, preview: null, status: "idle" },
    }));
  }, []);

  // Upload des documents
  const handleUploadAll = useCallback(async () => {
    const toUpload = Object.entries(documents).filter(
      ([type, doc]) =>
        steps.includes(type as DocumentType) &&
        doc.status === "captured" &&
        doc.file,
    ) as [DocumentType, DocumentState][];

    if (toUpload.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    let successCount = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const [type, doc] = toUpload[i];
      setDocuments((prev) => ({
        ...prev,
        [type]: { ...prev[type], status: "uploading" },
      }));

      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("type", type);
      formData.append("file", doc.file!);

      try {
        const res = await fetch("/api/mobile-upload/upload", {
          method: "POST",
          body: formData,
        });
        const responseData = await res.json();

        if (res.ok && responseData.success) {
          successCount++;
          setDocuments((prev) => ({
            ...prev,
            [type]: { ...prev[type], status: "uploaded" },
          }));
        } else {
          setDocuments((prev) => ({
            ...prev,
            [type]: {
              ...prev[type],
              status: "error",
              errorMessage: responseData.error || "Erreur",
            },
          }));
        }
      } catch {
        setDocuments((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            status: "error",
            errorMessage: "Erreur de connexion",
          },
        }));
      }
      setUploadProgress(Math.round(((i + 1) / toUpload.length) * 100));
    }

    setUploading(false);
    if (successCount === steps.length) {
      setAllUploaded(true);
      setShowSuccess(true);
    }
  }, [documents, sessionId, steps]);

  const resetUpload = useCallback(() => {
    setDocuments(getInitialDocuments());
    setAllUploaded(false);
    setUploadProgress(0);
    if (currentStepIndex !== 0) goToStep(0);
  }, [getInitialDocuments, currentStepIndex, goToStep]);

  const currentType = steps[currentStepIndex];
  const currentDocument = documents[currentType];
  const uploadedCount = Object.entries(documents).filter(
    ([type, d]) =>
      steps.includes(type as DocumentType) && d.status === "uploaded",
  ).length;
  const hasAnyContent = Object.entries(documents).some(
    ([type, d]) => steps.includes(type as DocumentType) && d.status !== "idle",
  );
  const allStepsReady = steps.every(
    (type) => documents[type]?.status === "captured",
  );
  const isTransitioning = animState !== "idle";
  const barPct = allUploaded
    ? 100
    : ((currentStepIndex + (currentDocument?.status !== "idle" ? 0.5 : 0)) /
        steps.length) *
      100;

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    // États
    documentMode,
    steps,
    uploading,
    uploadProgress,
    allUploaded,
    showSuccess,
    currentStepIndex,
    currentType,
    currentDocument,
    uploadedCount,
    hasAnyContent,
    allStepsReady,
    isTransitioning,
    barPct,
    animState,
    animDirection,
    pendingStepIndex,
    fileInputRefs,
    // Actions
    goNext,
    goPrev,
    handleCapture,
    handleRemove,
    handleUploadAll,
    resetUpload,
    setShowSuccess,
  };
}
