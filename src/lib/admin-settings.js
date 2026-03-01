const ADMIN_FLAGS_STORAGE_KEY = "admin_feature_flags";

const DEFAULT_ADMIN_FLAGS = {
  maintenanceMode: false,
  signupEnabled: true,
  freeSessionLimit: 10,
};

const normalizeLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_ADMIN_FLAGS.freeSessionLimit;
  return Math.max(0, Math.floor(parsed));
};

export const getDefaultAdminFlags = () => ({ ...DEFAULT_ADMIN_FLAGS });

export const getAdminFlags = () => {
  if (typeof window === "undefined") return getDefaultAdminFlags();

  const raw = localStorage.getItem(ADMIN_FLAGS_STORAGE_KEY);
  if (!raw) return getDefaultAdminFlags();

  try {
    const parsed = JSON.parse(raw);
    return {
      maintenanceMode: Boolean(parsed?.maintenanceMode),
      signupEnabled: parsed?.signupEnabled !== false,
      freeSessionLimit: normalizeLimit(parsed?.freeSessionLimit),
    };
  } catch {
    return getDefaultAdminFlags();
  }
};

export const saveAdminFlags = (flags) => {
  if (typeof window === "undefined") return;

  const next = {
    maintenanceMode: Boolean(flags?.maintenanceMode),
    signupEnabled: flags?.signupEnabled !== false,
    freeSessionLimit: normalizeLimit(flags?.freeSessionLimit),
  };

  localStorage.setItem(ADMIN_FLAGS_STORAGE_KEY, JSON.stringify(next));
};

export const getInterviewPlanLimits = () => {
  const flags = getAdminFlags();
  return {
    free: flags.freeSessionLimit,
    pro: Infinity,
    pro_plus: Infinity,
  };
};
