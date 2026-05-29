"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doctorAuthAPI } from "@/lib/api";

export default function DoctorLoginPage() {

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const res = await doctorAuthAPI.login(
        username,
        password
      );

      if (res.success) {

        localStorage.setItem(
          "doctor_token",
          res.data.token
        );

        localStorage.setItem(
          "doctor_data",
          JSON.stringify(res.data)
        );

        router.push("/doctor-dashboard");
      }

    } catch (error) {
      alert("Invalid credentials");
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-10 rounded-xl shadow-md w-[400px]">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Doctor Login
        </h1>

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-3 rounded mb-4"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded mb-6"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          onClick={handleLogin}
          className="w-full bg-purple-600 text-white p-3 rounded"
        >
          Login
        </button>

      </div>
    </div>
  );
}