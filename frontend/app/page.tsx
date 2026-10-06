"use client";
import { useState } from "react";

export default function Page() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [tenantId, setTenantId] = useState("hospital_123");
  const [persona, setPersona] = useState("receptionist");
  const [status, setStatus] = useState("");
  
  const handleCall = async () => {
    setStatus("Calling...");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/make-outbound-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          persona: persona,
          tenant_id: tenantId
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setStatus(`Call initiated. Room: ${data.room}`);
      } else {
        setStatus(`Error: ${data.message}`);
      }
    } catch (e: any) {
      setStatus(`Error calling backend: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "400px", margin: "0 auto" }}>
      <h1>AI Voice Agent Outbound</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Phone Number:</label>
        <input 
          type="tel" 
          value={phoneNumber} 
          onChange={(e) => setPhoneNumber(e.target.value)} 
          placeholder="+15551234567"
          style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Persona:</label>
        <select 
          value={persona} 
          onChange={(e) => setPersona(e.target.value)}
          style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        >
          <option value="default">Default / Friendly</option>
          <option value="technical">Technical Support</option>
        </select>
      </div>

      <button 
        onClick={handleCall}
        style={{ width: "100%", padding: "15px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "5px", fontSize: "16px", cursor: "pointer" }}
      >
        Call Me
      </button>

      {status && (
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
          {status}
        </div>
      )}
    </div>
  );
}
