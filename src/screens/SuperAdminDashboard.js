import React, { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config/api";
const API_ENDPOINTS = {
  dashboardStats: "",
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!API_ENDPOINTS.dashboardStats) {
          setLoading(false);
          return;
        }

        const { data } = await axios.get(API_ENDPOINTS.dashboardStats, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        setStats(data.data);
      } catch (error) {
        console.error("Error fetching Bellaj statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="text-red-600 text-lg font-semibold">
          Loading Bellaj Command Center...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Bellaj Data Hub
          </h2>
          <p className="text-gray-500">
            Dashboard endpoint has not been configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border-l-4 border-red-600">
        <h1 className="text-3xl font-bold text-red-600">
          Bellaj Data Hub Command Center
        </h1>

        <p className="text-gray-500 mt-2">
          Real-time overview of platform performance, finances and users.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Revenue */}
        <div className="bg-red-600 text-white p-5 rounded-2xl shadow-lg">
          <p className="text-sm uppercase opacity-80">Total Revenue</p>

          <h2 className="text-2xl font-bold mt-2">
            ₦{stats?.finance?.totalRevenue?.toLocaleString() || "0"}
          </h2>
        </div>

        {/* Transactions */}
        <div className="bg-green-700 text-white p-5 rounded-2xl shadow-lg">
          <p className="text-sm uppercase opacity-80">
            Successful Transactions
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {stats?.finance?.successfulTransactions || 0}
          </h2>
        </div>

        {/* Agents */}
        <div className="bg-red-500 text-white p-5 rounded-2xl shadow-lg">
          <p className="text-sm uppercase opacity-80">Registered Agents</p>

          <h2 className="text-2xl font-bold mt-2">
            {stats?.users?.totalAgents || 0}
          </h2>
        </div>

        {/* Admins */}
        <div className="bg-green-600 text-white p-5 rounded-2xl shadow-lg">
          <p className="text-sm uppercase opacity-80">Administrators</p>

          <h2 className="text-2xl font-bold mt-2">
            {stats?.users?.totalAdmins || 0}
          </h2>
        </div>
      </div>

      {/* Additional Overview */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-green-700 mb-4">
          Platform Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border">
            <p className="text-gray-500 text-sm">Total Users</p>

            <h4 className="text-2xl font-bold text-slate-800">
              {stats?.users?.totalUsers || 0}
            </h4>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border">
            <p className="text-gray-500 text-sm">Active Supervisors</p>

            <h4 className="text-2xl font-bold text-slate-800">
              {stats?.users?.totalSupervisors || 0}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
