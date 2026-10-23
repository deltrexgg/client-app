
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PAGE_SIZE = 10;

function getField(patient, fields) {
  for (const field of fields) {
    const value = patient?.[field];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "-";
}

function getPatientName(patient) {
  const name = getField(patient, [
    "patient_name",
    "name",
    "full_name",
  ]);

  if (name !== "-") return name;

  const firstName = patient?.first_name || patient?.firstname || "";
  const lastName = patient?.last_name || patient?.lastname || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "-";
}

function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadMessage, setLoadMessage] = useState(false)

  const totalPages = Math.max(
    1,
    Math.ceil(patients.length / PAGE_SIZE)
  );

  const visiblePatients = patients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  async function fetchPatients() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/api/patients`);

      
      setPatients(response.data.patients || []);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch patients."
      );
    } finally {
      setLoading(false);
    }
  }
  
  async function syncPatients() {
    setSyncing(true);
    setError("");
    
    try {
      setLoadMessage(true)
      await axios.post(`${API_URL}/api/patients/sync`);
      await fetchPatients();
    } catch (err) {
      setLoadMessage(false)
      setError(
        err.response?.data?.message || "Failed to sync patients."
      );
    } finally {
      setLoadMessage(false)
      setSyncing(false);
    }
  }

  useEffect(() => {
    fetchPatients();
  }, []);

  function getPatientValue(patient, fields) {
    const data = patient.data || patient;
    return getField(data, fields);
  }

  function getRegistrationId(patient) {
    const registrationId = getPatientValue(patient, [
      "registration_id",
      "reg_id",
    ]);

    if (registrationId !== "-") return registrationId;

    return patient.externalId || "-";
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Patients</h1>
          <p>View and manage synced patient records.</p>
        </div>

        <button
          className="sync-button"
          onClick={syncPatients}
          disabled={syncing || loading}
        >
          {syncing ? "Syncing..." : "Sync Patients"}
        </button>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

{loadMessage === true && (
  <div className="popup-overlay">
    <div className="popup-box">
      <div className="loading-spinner"></div>
      <p>Syncing patient data into the database...</p>
    </div>
  </div>
)}

      <section className="table-container">
        <table>
          <thead>
            <tr>
              <th>Reg. ID</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Mobile</th>
              <th>Address</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="table-message">
                  Loading patients...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-message">
                  No patients found. Click Sync Patients to fetch records.
                </td>
              </tr>
            ) : (
              visiblePatients.map((patient) => {
                const data = patient.data || patient;

                return (
                  <tr key={patient._id || patient.externalId}>
                    <td>{getRegistrationId(patient)}</td>

                    <td className="patient-name">
                      {getPatientName(data)}
                    </td>

                    <td>
                      {getPatientValue(patient, ["gender", "sex"])}
                    </td>

                    <td>
                      {getPatientValue(patient, ["age"])}
                    </td>

                    <td>
                      {getPatientValue(patient, [
                        "mobile_no",
                        "mobile",
                        "phone",
                        "phone_number",
                        "contact_number",
                      ])}
                    </td>

                    <td className="address-cell">
                      {getPatientValue(patient, [
                        "address",
                        "full_address",
                        "patient_address",
                      ])}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {!loading && patients.length > 0 && (
        <div className="pagination">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}
            {"–"}
            {Math.min(currentPage * PAGE_SIZE, patients.length)}
            {" of "}
            {patients.length} patients
          </span>

          <div className="pagination-buttons">
            <button
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span className="page-number">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
