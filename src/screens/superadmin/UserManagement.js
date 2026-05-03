import React, { useState, useEffect } from "react";
import axios from "axios";

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  // Kira dukkan users (Zaka iya amfani da endpoint din admin tunda kana da iko)
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await axios.get("/api/v1/admin/users");
      setUsers(data.data);
    };
    fetchUsers();
  }, []);

  const changeRole = async (userId, newRole) => {
    if (
      window.confirm(`Are you sure you want to change this user to ${newRole}?`)
    ) {
      try {
        await axios.put("/api/v1/superadmin/manage-role", { userId, newRole });
        alert("Role updated successfully!");
        window.location.reload(); // Don sabunta list din
      } catch (err) {
        alert(err.response.data.message);
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Manage System Roles</h2>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Current Role</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="border p-2">
                {user.firstName} {user.surname}
              </td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2 font-bold">
                {user.role.toUpperCase()}
              </td>
              <td className="border p-2">
                <select
                  onChange={(e) => changeRole(user._id, e.target.value)}
                  className="border rounded p-1"
                >
                  <option value="">Change Role</option>
                  <option value="admin">Make Admin</option>
                  <option value="leader">Make Leader</option>
                  <option value="supervisor">Make Supervisor</option>
                  <option value="agent">Make Agent</option>
                  <option value="user">Make User</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
