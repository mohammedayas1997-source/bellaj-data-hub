import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/*
|--------------------------------------------------------------------------
| Bellaj Data Hub Admin API
|--------------------------------------------------------------------------
| Configure your backend endpoint below
|--------------------------------------------------------------------------
*/

const API_BASE_URL = "";

const getHeader = async () => {
  const token = await AsyncStorage.getItem("userToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
};

/*
|--------------------------------------------------------------------------
| Transaction Tracking
|--------------------------------------------------------------------------
*/
export const trackTx = async (transactionId) => {
  return axios.get(`${API_BASE_URL}/track/${transactionId}`, await getHeader());
};

/*
|--------------------------------------------------------------------------
| Debit User Wallet
|--------------------------------------------------------------------------
*/
export const debitUser = async (payload) => {
  return axios.post(`${API_BASE_URL}/debit-user`, payload, await getHeader());
};

/*
|--------------------------------------------------------------------------
| Resolve Customer Report
|--------------------------------------------------------------------------
*/
export const resolveIssue = async (payload) => {
  return axios.patch(
    `${API_BASE_URL}/handle-report`,
    payload,
    await getHeader(),
  );
};

/*
|--------------------------------------------------------------------------
| Get All Reports
|--------------------------------------------------------------------------
*/
export const getAllReports = async () => {
  return axios.get(`${API_BASE_URL}/all-reports`, await getHeader());
};

/*
|--------------------------------------------------------------------------
| Additional Bellaj Admin Functions
|--------------------------------------------------------------------------
*/

export const getAllUsers = async () => {
  return axios.get(`${API_BASE_URL}/users`, await getHeader());
};

export const blockUser = async (userId) => {
  return axios.patch(
    `${API_BASE_URL}/block-user`,
    { userId },
    await getHeader(),
  );
};

export const unblockUser = async (userId) => {
  return axios.patch(
    `${API_BASE_URL}/unblock-user`,
    { userId },
    await getHeader(),
  );
};

export const updateUserRole = async (userId, role) => {
  return axios.put(
    `${API_BASE_URL}/manage-role`,
    {
      userId,
      role,
    },
    await getHeader(),
  );
};

export default {
  trackTx,
  debitUser,
  resolveIssue,
  getAllReports,
  getAllUsers,
  blockUser,
  unblockUser,
  updateUserRole,
};
