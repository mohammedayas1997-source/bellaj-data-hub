import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config/api";

const API_BASE_URL = `${BASE_URL}/admin`;

const getHeader = async () => {
  const token =
    (await AsyncStorage.getItem("userToken")) ||
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("adminToken"));

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    timeout: 30000,
  };
};

export const trackTx = async (transactionId) => {
  return axios.get(
    `${API_BASE_URL}/track/${encodeURIComponent(transactionId)}`,
    await getHeader()
  );
};

export const debitUser = async (payload) => {
  return axios.post(`${API_BASE_URL}/debit-user`, payload, await getHeader());
};

export const resolveIssue = async (payload) => {
  return axios.patch(`${API_BASE_URL}/handle-report`, payload, await getHeader());
};

export const getAllReports = async () => {
  return axios.get(`${API_BASE_URL}/all-reports`, await getHeader());
};

export const getAllUsers = async () => {
  return axios.get(`${API_BASE_URL}/users`, await getHeader());
};

export const blockUser = async (userId) => {
  return axios.patch(`${API_BASE_URL}/block-user`, { userId }, await getHeader());
};

export const unblockUser = async (userId) => {
  return axios.patch(
    `${API_BASE_URL}/unblock-user`,
    { userId },
    await getHeader()
  );
};

export const updateUserRole = async (userId, newRole) => {
  return axios.put(
    `${API_BASE_URL}/manage-role`,
    { userId, newRole, role: newRole },
    await getHeader()
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