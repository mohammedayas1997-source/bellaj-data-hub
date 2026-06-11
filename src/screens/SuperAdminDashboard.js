import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config/api";
import {
  FaUsers,
  FaUserShield,
  FaUserTie,
  FaUserCheck,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaWallet,
  FaChartLine,
  FaEye,
  FaTasks,
  FaSignOutAlt,
Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const API_ENDPOINTS = {
  dashboardStats: `${BASE_URL}/admin/dashboard-stats`,
  users: `${BASE_URL}/admin/users`,
  transactions: `${BASE_URL}/admin/transactions`,
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    finance: {
      totalRevenue: 0,
      successfulTransactions: 0,
      walletBalance: 0,
    },
    users: {
      totalUsers: 0,
      totalAgents: 0,
      totalSupervisors: 0,
      totalAdmins: 0,
    },
  });

  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const token =
    localStorage.getItem("userToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const statsRes = await axios.get(API_ENDPOINTS.dashboardStats, {
          headers,
        });

        setStats(statsRes.data?.data || statsRes.data || stats);
      } catch (error) {
        console.log("Stats endpoint not ready yet");
      }

      try {
        const usersRes = await axios.get(API_ENDPOINTS.users, { headers });
        setUsers(usersRes.data?.data || usersRes.data?.users || []);
      } catch (error) {
        console.log("Users endpoint not ready yet");
      }

      try {
        const txRes = await axios.get(API_ENDPOINTS.transactions, {
          headers,
        });
        setTransactions(txRes.data?.data || txRes.data?.transactions || []);
      } catch (error) {
        console.log("Transactions endpoint not ready yet");
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const cards = [
    {
      title: "Total Users",
      value: stats?.users?.totalUsers || users.length || 0,
      icon: <FaUsers />,
      color: "bg-green-700",
    },
    {
      title: "Agents",
      value: stats?.users?.totalAgents || 0,
      icon: <FaUserTie />,
      color: "bg-red-600",
    },
    {
      title: "Supervisors",
      value: stats?.users?.totalSupervisors || 0,
      icon: <FaUserCheck />,
      color: "bg-green-600",
    },
    {
      title: "Admins",
      value: stats?.users?.totalAdmins || 0,
      icon: <FaUserShield />,
      color: "bg-red-500",
    },
    {
      title: "Total Revenue",
      value: `₦${Number(
        stats?.finance?.totalRevenue || 0
      ).toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      color: "bg-green-800",
    },
    {
      title: "Transactions",
      value: stats?.finance?.successfulTransactions || transactions.length || 0,
      icon: <FaExchangeAlt />,
      color: "bg-red-700",
    },
    {
      title: "Wallet Balance",
      value: `₦${Number(
        stats?.finance?.walletBalance || 0
      ).toLocaleString()}`,
      icon: <FaWallet />,
      color: "bg-green-500",
    },
    {
      title: "Platform Status",
      value: "Active",
      icon: <FaChartLine />,
      color: "bg-slate-800",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-100">
        <div className="text-green-700 text-lg font-bold">
          Loading Bellaj Admin Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-green-800 text-white px-6 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">
            Bellaj Data Hub
          </h1>
          <p className="text-green-100 text-sm">
            Super Admin Command Center
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>

      <div className="p-5 md:p-8">
        <div className="bg-white rounded-2xl shadow p-6 mb-8 border-l-4 border-green-700">
          <h2 className="text-2xl font-black text-slate-800">
            Welcome Super Admin
          </h2>
          <p className="text-slate-500 mt-1">
            Anan zaka iya ganin users, agents, supervisors, admins,
            transactions da aikin kowa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`${card.color} text-white rounded-2xl p-5 shadow-lg`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-80 uppercase font-bold">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-black mt-2">{card.value}</h3>
                </div>
                <div className="text-4xl opacity-90">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center gap-3 mb-5">
              <FaUsers className="text-green-700 text-2xl" />
              <h3 className="text-xl font-black text-slate-800">
                Users / Agents / Supervisors
              </h3>
            </div>

            {users.length === 0 ? (
              <div className="text-slate-500 bg-slate-50 p-5 rounded-xl border">
                Babu users da aka dawo dasu tukuna. Idan kana son su fito
                kai tsaye, sai backend endpoint ɗin{" "}
                <b>/admin/users</b> ya kasance.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3 font-bold">
                          {user.name || "No Name"}
                        </td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                            {user.role || "user"}
                          </span>
                        </td>
                        <td className="p-3">
                          <button className="bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                            <FaEye />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center gap-3 mb-5">
              <FaTasks className="text-red-600 text-2xl" />
              <h3 className="text-xl font-black text-slate-800">
                Recent Activities / Aikin Kowa
              </h3>
            </div>

            {transactions.length === 0 ? (
              <div className="text-slate-500 bg-slate-50 p-5 rounded-xl border">
                Babu transactions da aka dawo dasu tukuna. Idan kana son ganin
                aikin kowa, sai backend endpoint ɗin{" "}
                <b>/admin/transactions</b> ya kasance.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 8).map((tx, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 p-4 rounded-xl border flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {tx.type || tx.service || "Transaction"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {tx.userEmail || tx.email || "Unknown User"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-green-700">
                        ₦{Number(tx.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tx.status || "pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;