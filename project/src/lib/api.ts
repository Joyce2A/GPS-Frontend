
// const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

//
// ================================
// TOKEN HELPERS
// ================================
export const getAuthToken = () => localStorage.getItem("auth_token");
export const setAuthToken = (token: string) => localStorage.setItem("auth_token", token);
export const removeAuthToken = () => localStorage.removeItem("auth_token");

//
// ================================
// AUTH TYPES
// ================================
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: string;
}

export interface ForgotPasswordResponse {
  reset_token: string;
}

//
// ================================
// AUTH API
// ================================
class AuthAPI {
  async login(email: string, password: string): Promise<AuthResponse> {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Login failed");
    }

    const data = await res.json() as AuthResponse;

    // ✔️ SAVE TOKEN HERE
    setAuthToken(data.access_token);

    return data;
  }

  register(data: RegisterData) {
    return fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Signup failed");
      return res.json();
    });
  }

  forgotPassword(email: string) {
    return fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to request reset token");
      return res.json() as Promise<ForgotPasswordResponse>;
    });
  }

  resetPassword(token: string, newPassword: string) {
    return fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to reset password");
      return true;
    });
  }
}

export const authAPI = new AuthAPI();

//
// ================================
// COMMON FETCH WRAPPER
// ================================
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    let error = text;
    try { error = JSON.parse(text).detail; } catch {}
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response.status === 204 ? ({} as T) : response.json();
}

//
// ================================
// DEVICE TYPES
// ================================
export interface DeviceCreate {
  device_id: string;
  device_name: string;
  device_model: string;
  battery_level: number;
  device_status: string;
}

export interface DeviceUpdate {
  device_name?: string;
  device_model?: string;
  battery_level?: number;
  device_status?: string;
}

export interface DeviceOut {
  id: string;
  device_id: string;
  device_name?: string;
  device_model?: string;
  battery_level?: number;
  device_status?: string;
  time_stamp?: string;
}

//
// ================================
// ASSET TYPES
// ================================
export interface GeoPoint {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LinkedDevice {
  device_id: string;
  device_name?: string;
  device_model?: string;
  battery_level?: number | null;
  device_status?: string;
  link_status: string;
  linked_at: string;
}

export interface Asset {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_type: string;
  description?: string;
  registered_location: GeoPoint;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AssetWithDevices extends Asset {
  linked_devices: LinkedDevice[];
}

//
// ================================
// API CLIENT (SINGLE)
// ================================
class APIClient {
  //
  // -------- ASSETS ----------
  //
  
  getAssets() {
    return apiRequest<Asset[]>("/assets/");
  }

  getAssetById(assetId: string) {
    return apiRequest<Asset>(`/assets/by-asset/${assetId}`);
  }

  getAssetsWithDevices() {
    return apiRequest<AssetWithDevices[]>("/assets/with-devices/");
  }

  updateAssetLocation(assetId: string, location: GeoPoint) {
    return apiRequest(`/assets/by-asset/${assetId}/location`, {
      method: "PUT",
      body: JSON.stringify(location),
    });
  }

  createAsset(data: Partial<Asset>) {
    return apiRequest("/assets/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateAsset(assetId: string, updates: Partial<Asset>) {
    return apiRequest(`/assets/by-asset/${assetId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  deleteAsset(assetId: string) {
    return apiRequest(`/assets/by-asset/${assetId}`, {
      method: "DELETE",
    });
  }

  //
  // -------- DEVICES ----------
  //
  getAllDevices() {
    return apiRequest<DeviceOut[]>("/devices/");
  }

  getDeviceById(deviceId: string) {
    return apiRequest<DeviceOut>(`/devices/by-device/${deviceId}`);
  }

  createDevice(data: DeviceCreate) {
    return apiRequest<DeviceOut>("/devices/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateDevice(deviceId: string, updates: DeviceUpdate) {
    return apiRequest<DeviceOut>(`/devices/by-device/${deviceId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  deleteDevice(deviceId: string) {
    return apiRequest(`/devices/by-device/${deviceId}`, {
      method: "DELETE",
    });
  }

  //
  // -------- ASSET → DEVICE LINKING ----------
  //
  getDevicesByAsset(assetId: string) {
    return apiRequest<{ linked_devices: LinkedDevice[] }>(`/assets/${assetId}/devices`);
  }

  linkDevice(assetId: string, deviceId: string, status = "active") {
    return apiRequest("/assets/link-device", {
      method: "POST",
      body: JSON.stringify({ asset_id: assetId, device_id: deviceId, status }),
    });
  }

  unlinkDevice(assetId: string, deviceId: string) {
    return apiRequest(`/assets/unlink-device?asset_id=${assetId}&device_id=${deviceId}`, {
      method: "DELETE",
    });
  }

  updateLinkStatus(assetId: string, deviceId: string, status: string) {
    return apiRequest("/assets/link-status", {
      method: "PUT",
      body: JSON.stringify({ asset_id: assetId, device_id: deviceId, status }),
    });
  }
}

//
// 🔥 Export one clean instance
//
export const apiClient = new APIClient();



// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// // Token helpers
// export const getAuthToken = () => localStorage.getItem("auth_token");
// export const setAuthToken = (token: string) => localStorage.setItem("auth_token", token);
// export const removeAuthToken = () => localStorage.removeItem("auth_token");

// // ================================
// // AUTH API
// // ================================

// export interface AuthResponse {
//   access_token: string;
//   token_type: string;
// }

// export interface RegisterData {
//   email: string;
//   password: string;
//   role?: string;
// }

// export interface ForgotPasswordResponse {
//   reset_token: string;
// }

// class AuthAPI {
//   login(email: string, password: string) {
//     const formData = new URLSearchParams();
//     formData.append("username", email); // FastAPI OAuth2 expects 'username'
//     formData.append("password", password);

//     return fetch(`${API_URL}/auth/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: formData,
//     }).then(async (res) => {
//       if (!res.ok) throw new Error("Login failed");
//       return res.json() as Promise<AuthResponse>;
//     });
//   }

//   register(data: RegisterData) {
//     return fetch(`${API_URL}/auth/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     }).then(async (res) => {
//       if (!res.ok) throw new Error("Signup failed");
//       return res.json();
//     });
//   }

//   forgotPassword(email: string) {
//     return fetch(`${API_URL}/auth/forgot-password`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email }),
//     }).then(async (res) => {
//       if (!res.ok) throw new Error("Failed to request reset token");
//       return res.json() as Promise<ForgotPasswordResponse>;
//     });
//   }

//   resetPassword(token: string, newPassword: string) {
//     return fetch(`${API_URL}/auth/reset-password`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ token, new_password: newPassword }),
//     }).then(async (res) => {
//       if (!res.ok) throw new Error("Failed to reset password");
//       return true;
//     });
//   }
// }

// // Export singleton instance
// export const authAPI = new AuthAPI();

// // ================================
// // Common Fetch Wrapper
// async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
//   const token = getAuthToken();
//   if (!token) throw new Error("Not authenticated");

//   const headers: HeadersInit = {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${token}`,
//     ...options.headers,
//   };

//   const response = await fetch(`${API_URL}${endpoint}`, {
//     ...options,
//     headers,
//   });

//   if (!response.ok) {
//     const text = await response.text();
//     let error = { detail: text || `HTTP ${response.status}` };
//     try { error = JSON.parse(text); } catch {}
//     throw new Error(error.detail);
//   }

//   return response.status === 204 ? ({} as T) : response.json();
// }

// // ================================
// // DEVICE TYPES
// // ================================
// export interface DeviceCreate {
//   device_id: string;
//   device_name: string;
//   device_model: string;
//   battery_level: number;
//   device_status: string;
// }

// export interface DeviceUpdate {
//   device_name?: string;
//   device_model?: string;
//   battery_level?: number;
//   device_status?: string;
// }

// export interface DeviceOut {
//   id: string;
//   device_id: string;
//   device_name?: string;
//   device_model?: string;
//   battery_level?: number;
//   device_status?: string;
//   time_stamp?: string;
// }

// // ================================
// // API CLIENT
// // ================================
// class APIClient {
//   // -------- DEVICES ----------
//   getAllDevices(): Promise<DeviceOut[]> {
//     return apiRequest("/devices/");
//   }

//   getDeviceById(deviceId: string): Promise<DeviceOut> {
//     return apiRequest(`/devices/by-device/${deviceId}`);
//   }

//   createDevice(data: DeviceCreate): Promise<DeviceOut> {
//     return apiRequest("/devices/", {
//       method: "POST",
//       body: JSON.stringify(data),
//     });
//   }

//   updateDevice(deviceId: string, updates: DeviceUpdate): Promise<DeviceOut> {
//     return apiRequest(`/devices/by-device/${deviceId}`, {
//       method: "PUT",
//       body: JSON.stringify(updates),
//     });
//   }

//   deleteDevice(deviceId: string): Promise<{ detail: string }> {
//     return apiRequest(`/devices/by-device/${deviceId}`, {
//       method: "DELETE",
//     });
//   }

//   // -------- ASSETS (optional) ----------
//   getAssets() {
//     return apiRequest("/assets/");
//   }

//   getAssetById(assetId: string) {
//     return apiRequest(`/assets/by-asset/${assetId}`);
//   }

//   createAsset(data: any) {
//     return apiRequest("/assets/", { method: "POST", body: JSON.stringify(data) });
//   }

//   updateAsset(assetId: string, updates: any) {
//     return apiRequest(`/assets/by-asset/${assetId}`, { method: "PUT", body: JSON.stringify(updates) });
//   }

//   deleteAsset(assetId: string) {
//     return apiRequest(`/assets/by-asset/${assetId}`, { method: "DELETE" });
//   }
// }
// export const apiClient = new APIClient();

// // ================================
// // TYPES
// // ================================
// export interface GeoPoint {
//   latitude: number;
//   longitude: number;
//   address?: string;
// }

// export interface LinkedDevice {
//   device_id: string;
//   device_name?: string;
//   device_model?: string;
//   battery_level?: number | null;
//   device_status?: string;
//   link_status: string;
//   linked_at: string;
// }

// export interface Asset {
//   id: string;
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: GeoPoint;
//   user_id: string;
//   created_at: string;
//   updated_at: string;
// }

// export interface AssetWithDevices extends Asset {
//   linked_devices: LinkedDevice[];
// }

// // ================================
// // API CLIENT
// // ================================
// class APIClient {
//   // -------- Assets ----------
//   getAssets() {
//     return apiRequest<Asset[]>("/assets/");
//   }

//   getAssetById(assetId: string) {
//     return apiRequest<Asset>(`/assets/by-asset/${assetId}`);
//   }

//   getAssetsWithDevices() {
//     return apiRequest<AssetWithDevices[]>("/assets/with-devices/");
//   }

//   updateAssetLocation(assetId: string, location: GeoPoint) {
//     return apiRequest(`/assets/by-asset/${assetId}/location`, {
//       method: "PUT",
//       body: JSON.stringify(location),
//     });
//   }

//   createAsset(data: Partial<Asset>) {
//     return apiRequest("/assets/", {
//       method: "POST",
//       body: JSON.stringify(data),
//     });
//   }

//   updateAsset(assetId: string, updates: Partial<Asset>) {
//     return apiRequest(`/assets/by-asset/${assetId}`, {
//       method: "PUT",
//       body: JSON.stringify(updates),
//     });
//   }

//   deleteAsset(assetId: string) {
//     return apiRequest(`/assets/by-asset/${assetId}`, {
//       method: "DELETE",
//     });
//   }

//   // -------- Devices ----------
//   getDeviceById(deviceId: string) {
//     return apiRequest(`/devices/by-device/${deviceId}`);
//   }

//   getAllDevices() {
//     return apiRequest(`/devices/`);
//   }

//   // -------- Asset → Device Linking ----------
//   getDevicesByAsset(assetId: string) {
//     return apiRequest<{ linked_devices: LinkedDevice[] }>(`/assets/${assetId}/devices`);
//   }

//   linkDevice(assetId: string, deviceId: string, status = "active") {
//     return apiRequest("/assets/link-device", {
//       method: "POST",
//       body: JSON.stringify({ asset_id: assetId, device_id: deviceId, status }),
//     });
//   }

//   unlinkDevice(assetId: string, deviceId: string) {
//     return apiRequest(`/assets/unlink-device?asset_id=${assetId}&device_id=${deviceId}`, {
//       method: "DELETE",
//     });
//   }

//   updateLinkStatus(assetId: string, deviceId: string, status: string) {
//     return apiRequest("/assets/link-status", {
//       method: "PUT",
//       body: JSON.stringify({ asset_id: assetId, device_id: deviceId, status }),
//     });
//   }
// }

// // Export single instance
// export const apiClient = new APIClient();

