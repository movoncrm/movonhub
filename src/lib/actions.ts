export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Optional one-time result data (e.g. generated credentials, public URL). */
  meta?: {
    slug?: string;
    publicUrl?: string;
    password?: string;
  };
}

export const emptyActionState: ActionState = {};
