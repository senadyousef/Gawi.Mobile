import i18n from '../localization';
import { API_BASE_ENDPOINT } from '../constants';
import { addQueryItems, handleGetToken } from '../helpers';
import { API_ENDPOINTS, IapiResponse, Ievent, IuserEvent } from '../types';

export const handleBookEvent = async ({
  userId,
  eventsId,
  handleLogout,
}: {
  userId: number;
  eventsId: number;
  handleLogout: () => Promise<void>;
}): Promise<IapiResponse<Ievent[]> | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return;
  }

  const res = await fetch(`${API_BASE_ENDPOINT}${API_ENDPOINTS.USER_EVENTS}`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      eventsId,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const resjson: IapiResponse<Ievent[]> = await res.json().catch((err) => {
    throw new Error(i18n.t('an_error_occured'));
  });

  if (res.status === 201) {
    return resjson;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else if (res.status === 400) {
    throw new Error(resjson?.message);
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};

export const handleFetchUserEvents = async ({
  page,
  userId,
  pageSize = 10,
  handleLogout,
}: {
  page: number;
  userId: number;
  pageSize?: number;
  handleLogout: () => Promise<void>;
}): Promise<IapiResponse<IuserEvent[]> | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return;
  }

  const query = addQueryItems([
    { name: 'userId', value: userId },
    { name: 'currentPage', value: page },
    { name: 'pageSize', value: pageSize },
  ]);

  const res = await fetch(
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.USER_EVENTS}${query}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const resjson: IapiResponse<IuserEvent[]> = await res.json().catch((err) => {
    throw new Error(i18n.t('an_error_occured'));
  });

  if (res.status === 200) {
    return resjson;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else if (res.status === 400) {
    throw new Error(resjson?.message);
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};
