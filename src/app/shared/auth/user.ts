export class User {
  id: number;
  name: string;
  email: string;

  getEmailWithoutDomain(): string {
    return this.email ? this.email.split('@')[0] : '';
  }
}


export enum VipStatus {
  Requested = 'requested',
  WrongPhone = 'wrong_phone',
  Confirmed = 'confirmed',
  Rejected = 'rejected'
}


export function vipStatusIsSet(status: VipStatus): boolean {
  return status === VipStatus.Confirmed
    || status === VipStatus.Rejected
    || status === VipStatus.Requested
    || status === VipStatus.WrongPhone;
}


export interface VipStatusInfo {
  message: string;
  status: VipStatus | null,
  requests_count?: number;
  provided_request_vip_count?: number | null;
}


export enum RegistrationSource {
  UserMenu = 'user-menu',
  Vip = 'vip'
}
