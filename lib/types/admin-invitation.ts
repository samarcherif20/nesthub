export interface AdminInvitation {
  id: string;
  email: string;
  token: string;
  invitedBy: string;
  role: 'ADMIN' 
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface CreateInvitationDTO {
  email: string;
  role: string;
}

export interface InvitationResponse {
  success: boolean;
  invitation?: AdminInvitation;
  error?: string;
}

export interface InvitationsListResponse {
  invitations: AdminInvitation[];
  stats: {
    active: number;
    expired: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}