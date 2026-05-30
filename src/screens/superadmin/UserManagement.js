import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../config/api";

const API_ENDPOINTS = {
  users: "",
  manageRole: "",
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      if (!API_ENDPOINTS.users) {
        setUsers([]);
        return;
      }

      const { data } = await axios.get(API_ENDPOINTS.users);
      setUsers(data?.data || []);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId, newRole) => {
    if (!newRole) return;

    const confirmed = window.confirm(
      `Are you sure you want to change this user to ${newRole}?`,
    );

    if (!confirmed) return;

    if (!API_ENDPOINTS.manageRole) {
      alert("Manage role API endpoint is not configured.");
      return;
    }

    try {
      setUpdatingUserId(userId);

      await axios.put(API_ENDPOINTS.manageRole, {
        userId,
        newRole,
      });

      alert("Bellaj Data Hub role updated successfully!");
      await fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-red-600 font-bold text-lg">
          Loading Bellaj users...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-red-600 mb-6">
        <h2 className="text-3xl font-bold text-red-600">
          Bellaj Role Management
        </h2>

        <p className="text-gray-500 mt-2">
          Manage admins, leaders, supervisors, agents and users.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white text-left">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Current Role</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-6 text-center text-gray-500 font-semibold"
                  >
                    No Bellaj users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b hover:bg-slate-50 transition"
                  >
                    <td className="p-4 font-semibold text-slate-800">
                      {user.firstName} {user.surname}
                    </td>

                    <td className="p-4 text-slate-600">{user.email}</td>

                    <td className="p-4">
                      <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {user.role || "user"}
                      </span>
                    </td>

                    <td className="p-4">
                      <select
                        disabled={updatingUserId === user._id}
                        onChange={(e) => changeRole(user._id, e.target.value)}
                        className="border border-slate-200 rounded-xl p-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                        defaultValue=""
                      >
                        <option value="">
                          {updatingUserId === user._id
                            ? "Updating..."
                            : "Change Role"}
                        </option>
                        <option value="admin">Make Admin</option>
                        <option value="leader">Make Leader</option>
                        <option value="supervisor">Make Supervisor</option>
                        <option value="agent">Make Agent</option>
                        <option value="user">Make User</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
