import { API_BASE_ENDPOINT } from '../constants';
import { handleGetToken } from '../helpers';

export interface IUserProfile {
  age: number;
  bod: string;
  nameEn: string;
  nameAr: string;
  photoUri?: string;
  membershipStatus: string;
  membershipExpDate: string;
  id: number;
  email: string;
  role: string;
  mobilePhone: string;
  refreshToken: string;
  ProfilePictureDataUrl?: string;
}

export const fetchCurrentUserProfile = async (): Promise<IUserProfile | null> => {
  try {
    const token = await handleGetToken();
    if (!token) {
      console.warn('Missing token');
      return null;
    }

    const response = await fetch(`${API_BASE_ENDPOINT}/Profile/GetMyProfile`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch profile:', response.status);
      return null;
    }

    const data: IUserProfile = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};
