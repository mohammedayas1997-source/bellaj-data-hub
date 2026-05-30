import React, { useState } from "react";
import axios from "axios";
import BASE_URL from "../config/api";
const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
};

const API_ENDPOINTS = {
  searchUser: "",
  traceService: "",
};

const SupportDashboard = () => {
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState("bvn");
  const [userData, setUserData] = useState(null);
  const [traceData, setTraceData] = useState([]);
  const [loading, setLoading] = useState(false);

  const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

  const handleUserSearch = async () => {
    if (!identifier.trim()) {
      alert("Please enter an identifier.");
      return;
    }

    if (!API_ENDPOINTS.searchUser) {
      alert("Search user API endpoint is not configured.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.get(
        `${API_ENDPOINTS.searchUser}/${identifier.trim()}`,
        config,
      );

      setUserData(res.data.data);
      setTraceData([]);
    } catch (err) {
      alert(err.response?.data?.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  const handleTrace = async () => {
    if (!identifier.trim()) {
      alert("Please enter an identifier.");
      return;
    }

    if (!API_ENDPOINTS.traceService) {
      alert("Trace service API endpoint is not configured.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.get(
        `${API_ENDPOINTS.traceService}/${type}/${identifier.trim()}`,
        config,
      );

      setTraceData(res.data.data || []);
      setUserData(null);
    } catch (err) {
      alert(err.response?.data?.message || "No records found for this ID");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="bg-white p-6 rounded-2xl shadow-md mb-6 border-l-4 border-red-600">
        <h1 className="text-3xl font-bold text-red-600">
          Bellaj Support & Tracing Portal
        </h1>

        <p className="text-gray-500 mt-2">
          Trace BVN, NIMC, data, airtime, cable and utility transactions.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-semibold text-gray-700">
            Identifier
          </label>

          <input
            type="text"
            className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Email / Phone / NIN / BVN"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <select
          className="border border-slate-200 p-3 rounded-xl bg-white h-[48px] focus:outline-none focus:ring-2 focus:ring-green-700"
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
            <option value="cable">Cable TV</option>
            <option value="utility">Electricity</option>
          </optgroup>
        </select>

        <button
          onClick={handleUserSearch}
          className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 h-[48px] font-bold"
        >
          Search User
        </button>

        <button
          onClick={handleTrace}
          className="bg-green-700 text-white px-5 py-3 rounded-xl hover:bg-green-800 h-[48px] font-bold"
        >
          Trace ID
        </button>
      </div>

      {loading && (
        <p className="text-red-600 font-bold mb-4">
          Processing Bellaj request...
        </p>
      )}

      {userData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow border-l-4 border-red-600">
            <h2 className="font-bold text-lg mb-3 text-red-600">
              User Profile
            </h2>

            <p>
              <strong>Name:</strong> {userData?.profile?.firstName}{" "}
              {userData?.profile?.surname}
            </p>

            <p>
              <strong>Email:</strong> {userData?.profile?.email}
            </p>

            <p>
              <strong>Phone:</strong> {userData?.profile?.phone}
            </p>

            <p>
              <strong>Wallet:</strong> ₦{userData?.profile?.walletBalance || 0}
            </p>
          </div>

          <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow">
            <h2 className="font-bold text-lg mb-3 text-green-700">
              Recent Transactions
            </h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="p-2">Ref</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {(userData?.recentTransactions || []).map((tx) => (
                  <tr key={tx._id} className="border-b">
                    <td className="py-2">{tx.reference}</td>
                    <td>₦{tx.amount}</td>
                    <td
                      className={
                        tx.status === "success"
                          ? "text-green-700 font-bold"
                          : "text-red-600 font-bold"
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

      {traceData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-green-700 mt-6">
          <h2 className="font-bold text-xl mb-4 uppercase text-red-600">
            {type} Verification Records
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-700 text-white text-left">
                  <th className="p-2">Date</th>
                  <th className="p-2">User</th>
                  <th className="p-2">ID Number</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {traceData.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-slate-50">
                    <td className="p-2 text-xs">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                    <td className="p-2 font-semibold">
                      {item.user?.firstName} {item.user?.surname}
                    </td>

                    <td className="p-2 font-mono">
                      {item.bvnNumber || item.ninNumber || item.identifier}
                    </td>

                    <td className="p-2 uppercase text-xs text-red-600 font-bold">
                      {item.serviceType}
                    </td>

                    <td
                      className={`p-2 font-bold ${
                        item.status === "success"
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      {item.status?.toUpperCase()}
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
