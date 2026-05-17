import i18n from '../localization';
import { API_BASE_ENDPOINT } from '../constants';
import { addQueryItems, handleGetToken } from '../helpers';
import { API_ENDPOINTS, IapiResponse, Inews } from '../types';

export const handleFetchNews = async ({
  page,
  pageSize,
  handleLogout,
}: {
  page: number;
  pageSize?: number;
  handleLogout: () => Promise<void>;
}): Promise<IapiResponse<Inews[]> | undefined> => {
  const token = await handleGetToken();
  

  if (!token) {
    await handleLogout();
    return;
  }

  const query = addQueryItems([
    { name: 'currentPage', value: page },
    { name: 'pageSize', value: pageSize },
  ]);

  const url = `${API_BASE_ENDPOINT}${API_ENDPOINTS.NEWS}${query}`;
  

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  
  const bodyText = await res.text();
  

  if (res.status === 200) {
    try {
      const resjson: IapiResponse<Inews[]> = JSON.parse(bodyText);
      return resjson;
    } catch (err) {
      console.error('JSON parsing error:', err);
      throw new Error(i18n.t('an_error_occured'));
    }
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};
