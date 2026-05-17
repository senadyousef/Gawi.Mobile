import i18n from '../localization';
import { API_BASE_ENDPOINT } from '../constants';
import { addQueryItems, handleGetToken } from '../helpers';
import { API_ENDPOINTS, IapiResponse, IcartItem } from '../types';

export const handleFetchCartItems = async ({
  page,
  userId,
  pageSize,
  handleLogout,
}: {
  page: number;
  userId: number;
  pageSize?: number;
  handleLogout: () => Promise<void>;
}): Promise<IapiResponse<IcartItem[]> | undefined> => {
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
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.CARTS}${query}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (res.status === 200) {
    return (await res.json()) as IapiResponse<IcartItem[]>;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } 
};

export const handleFetchCartItem = async ({
  id,
  handleLogout,
}: {
  id: number;
  handleLogout: () => Promise<void>;
}): Promise<IcartItem | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return;
  }

  const res = await fetch(`${API_BASE_ENDPOINT}${API_ENDPOINTS.CARTS}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 200) {
    return (await res.json()) as IcartItem;
  } else if (res.status === 401) {
    await handleLogout();
    return;
  } else if (res.status === 404) {
    return;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};

export const handleAddCartItem = async ({
  userId,
  itemId,
  billId,
  quantity,
  handleLogout,
}: {
  userId: number;
  itemId: number;
  billId?: number;
  quantity: number;
  handleLogout: () => Promise<void>;
}): Promise<boolean> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return false;
  }

  const res = await fetch(`${API_BASE_ENDPOINT}${API_ENDPOINTS.CARTS}`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      quantity,
      itemsId: itemId,
      ...(billId ? { billId } : {}),
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 201) {
    return true;
  } else if (res.status === 401) {
    await handleLogout();
    return false;
    // }
    // else if (res.status === 400) {
    //   throw new Error(resjson?.message);
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};

export const handleUpdateCartItemQuantity = async ({
  id,
  userId,
  itemId,
  billId,
  quantity,
  handleLogout,
}: {
  id: number;
  userId: number;
  itemId: number;
  billId: number;
  quantity: number;
  handleLogout: () => Promise<void>;
}): Promise<boolean> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return false;
  }

  const res = await fetch(`${API_BASE_ENDPOINT}${API_ENDPOINTS.CARTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      id,
      userId,
      billId,
      quantity,
      itemsId: itemId,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    
  });

  if (res.status === 200) {
    return true;
  } else if (res.status === 401) {
    await handleLogout();
    return false;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};

export const handleDeleteCartItem = async ({
  id,
  handleLogout,
}: {
  id: number;
  handleLogout: () => Promise<void>;
}): Promise<boolean> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout();
    return false;
  }

  const res = await fetch(`${API_BASE_ENDPOINT}${API_ENDPOINTS.CARTS}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 204) {
    return true;
  } else if (res.status === 401) {
    await handleLogout();
    return false;
  } else {
    throw new Error(i18n.t('an_error_occured'));
  }
};
