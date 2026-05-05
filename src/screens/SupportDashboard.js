import React, { useState } from "react";
import axios from "axios";

const SupportDashboard = () => {
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState("bvn"); // bvn or nimc
  const [userData, setUserData] = useState(null);
  const [traceData, setTraceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const config = {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  };

  // 1. Search for User & Transactions
  const handleUserSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/v1/support/search-user/${identifier}`,
        config,
      );
      setUserData(res.data.data);
      setTraceData([]); // Clear trace when searching new user
    } catch (err) {
      alert(err.response?.data?.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  // 2. Trace Specific Service (BVN/NIMC)
  const handleTrace = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/v1/support/trace/${type}/${identifier}`,
        config,
      );
      setTraceData(res.data.data);
      setUserData(null); // Clear user profile when tracing specific work
    } catch (err) {
      alert(err.response?.data?.message || "No records found for this ID");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">
        Support & Tracing Portal
      </h1>

      {/* SEARCH BAR */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700">
            Identifier (Email/Phone/NIN/BVN)
          </label>
          <input
            type="text"
            className="w-full mt-1 border p-2 rounded"
            placeholder="Enter search term..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>
        // A cikin SupportDashboard.jsx, canja bangaren Select din zuwa haka:
        <select
          className="border p-2 rounded bg-white h-[42px]"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <optgroup label="Identity Services">
            <option value="bvn">BVN Service</option>
            <option value="nimc">NIMC Service</option>
          </optgroup>
          <optgroup label="VTU & Bills">
            <option value="data">Mobile Data</option>
            <option value="vtu">Airtime / VTU</option>
            <option value="cable">Cable TV (GOTV/DSTV)</option>
            <option value="utility">Electricity (Units)</option>
          </optgroup>
        </select>
        <button
          onClick={handleUserSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 h-[42px]"
        >
          Search User
        </button>
        <button
          onClick={handleTrace}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 h-[42px]"
        >
          Trace ID
        </button>
      </div>

      {loading && (
        <p className="text-blue-600 font-bold">Processing request...</p>
      )}

      {/* USER PROFILE & TRANSACTIONS */}
      {userData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
            <h2 className="font-bold text-lg mb-2">User Profile</h2>
            <p>
              <strong>Name:</strong> {userData.profile.firstName}{" "}
              {userData.profile.surname}
            </p>
            <p>
              <strong>Email:</strong> {userData.profile.email}
            </p>
            <p>
              <strong>Phone:</strong> {userData.profile.phone}
            </p>
            <p>
              <strong>Wallet:</strong> ₦{userData.profile.walletBalance}
            </p>
          </div>
          <div className="lg:col-span-2 bg-white p-4 rounded shadow">
            <h2 className="font-bold text-lg mb-2">Recent Transactions</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th>Ref</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {userData.recentTransactions.map((tx) => (
                  <tr key={tx._id} className="border-b">
                    <td className="py-2">{tx.reference}</td>
                    <td>₦{tx.amount}</td>
                    <td
                      className={
                        tx.status === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {tx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRACE RESULTS (BVN/NIMC) */}
      {traceData.length > 0 && (
        <div className="bg-white p-6 rounded shadow-md border-t-4 border-orange-500">
          <h2 className="font-bold text-xl mb-4 uppercase">
            {type} Verification Records
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">User</th>
                  <th className="p-2">ID Number</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {traceData.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-xs">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 font-semibold">
                      {item.user?.firstName} {item.user?.surname}
                    </td>
                    <td className="p-2 font-mono">
                      {item.bvnNumber || item.ninNumber}
                    </td>
                    <td className="p-2 uppercase text-xs text-blue-600">
                      {item.serviceType}
                    </td>
                    <td
                      className={`p-2 font-bold ${item.status === "success" ? "text-green-600" : "text-red-500"}`}
                    >
                      {item.status.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;
