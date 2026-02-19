export interface KeycloakUser {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  emailVerified: boolean;
  enabled: boolean;
  createdTimestamp: number;
  attributes?: Record<string, string[]>;
  realmRoles?: string[];
}

export interface KeycloakUserCreate {
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  enabled: boolean;
  credentials?: KeycloakCredential[];
  realmRoles?: string[];
}

export interface KeycloakUserUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  enabled?: boolean;
  attributes?: Record<string, string[]>;
}

export interface KeycloakCredential {
  type: string;
  value: string;
  temporary: boolean;
}

export interface KeycloakRole {
  id: string;
  name: string;
  description: string | null;
  composite: boolean;
}

export interface KeycloakSession {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  start: number;
  lastAccess: number;
  clients: Record<string, string>;
}

export interface UserWithRoles extends KeycloakUser {
  roles: string[];
}

export const ASSIGNABLE_ROLES = ['ADMIN', 'CONSUL', 'OFFICER', 'VIEWER', 'EDITOR'];

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: 'userAdmin.role.adminDesc',
  CONSUL: 'userAdmin.role.consulDesc',
  OFFICER: 'userAdmin.role.officerDesc',
  VIEWER: 'userAdmin.role.viewerDesc',
  EDITOR: 'userAdmin.role.editorDesc',
};

export const ROLE_ICONS: Record<string, string> = {
  ADMIN: 'admin_panel_settings',
  CONSUL: 'badge',
  OFFICER: 'person',
  VIEWER: 'visibility',
  EDITOR: 'edit_note',
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#f44336',
  CONSUL: '#2196f3',
  OFFICER: '#4caf50',
  VIEWER: '#9e9e9e',
  EDITOR: '#ff9800',
};
