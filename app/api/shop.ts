import i18n from '../localization';
import { API_BASE_ENDPOINT } from '../constants';
import { addQueryItems, handleGetToken } from '../helpers';
import { API_ENDPOINTS, IapiResponse, IshopItem } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const handleFetchStoreItems = async ({
  page,
  storeId,
  pageSize,
  searchText,
  handleLogout,
}: {
  page: number;
  storeId?: number;
  pageSize?: number;
  searchText?: string;
  handleLogout: () => Promise<void>;
}): Promise<IapiResponse<IshopItem[]> | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return;
  }

  const query = addQueryItems([
    { name: 'userId', value: storeId },
    { name: 'currentPage', value: page },
    { name: 'pageSize', value: pageSize },
    { name: 'nameEn', value: searchText },
    { name: 'nameAr', value: searchText },
    { name: 'description', value: searchText },
  ]);

  const res = await fetch(
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.SHOP_ITEM}${query}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (res.status === 200) {
    return (await res.json()) as IapiResponse<IshopItem[]>;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};

export const handleFetchItem = async ({
  id,
  handleLogout,
}: {
  id: number;
  handleLogout: () => Promise<void>;
}): Promise<IshopItem | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return;
  }
      const MemberId = (await AsyncStorage.getItem("MemberId")) || "0";

  const res = await fetch(
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.SHOP_ITEM}${MemberId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (res.status === 200) {
    return (await res.json()) as IshopItem;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};
