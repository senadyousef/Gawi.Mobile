import i18n from '../localization';
import { API_BASE_ENDPOINT } from '../constants';
import { addQueryItems, handleGetToken, log } from '../helpers';
import { API_ENDPOINTS, IeventDatesRes, IapiResponse, Ievent } from '../types';

export const handleFetchEventsDates = async ({
  year,
  month,
  userId,
  handleLogout,
}: {
  year: number;
  month: number;
  userId: number;
  handleLogout: () => Promise<void>;
}): Promise<IeventDatesRes | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return;
  }

  const res = await fetch(
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.EVENTS}${API_ENDPOINTS.GET_DATES}?year=${year}&month=${month}&id=${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const resjson: IeventDatesRes = await res.json();

  if (res.status === 200) {
    return resjson;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};

export const handleFetchEvents = async ({
  date,
  page,
  userId,
  pageSize,
  handleLogout,
}: {
  page: number;
  date?: string;
  userId: number;
  pageSize?: number;
  handleLogout: () => Promise<void>;
}): Promise<IapiResponse<Ievent[]> | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return;
  }

  const query = addQueryItems([
    { name: 'date', value: date },
    { name: 'userId', value: userId },
    { name: 'currentPage', value: page },
    { name: 'pageSize', value: pageSize },
  ]);

  const res = await fetch(
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.EVENTS}${query}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (res.status === 200) {
    const resjson: IapiResponse<Ievent[]> = await res.json();

    return resjson;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};

export const handleFetchEvent = async ({
  id,
  handleLogout,
}: {
  id: number;
  handleLogout: () => Promise<void>;
}): Promise<Ievent | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return;
  }

  const res = await fetch(`${API_BASE_ENDPOINT}${API_ENDPOINTS.EVENTS}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 200) {
    const resjson: Ievent = await res.json();

    return resjson;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};
